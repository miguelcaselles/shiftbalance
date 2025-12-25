import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const currentYear = new Date().getFullYear()

    // Get balance and requests
    const [balance, requests] = await Promise.all([
      session.user.employeeId
        ? db.vacationBalance.findUnique({
            where: {
              employeeId_year: {
                employeeId: session.user.employeeId,
                year: currentYear,
              },
            },
          })
        : null,
      session.user.employeeId
        ? db.vacationRequest.findMany({
            where: { employeeId: session.user.employeeId },
            orderBy: { createdAt: "desc" },
          })
        : [],
    ])

    // Create default balance if not exists
    let vacationBalance = balance
    if (!vacationBalance && session.user.employeeId) {
      vacationBalance = await db.vacationBalance.create({
        data: {
          employeeId: session.user.employeeId,
          year: currentYear,
          totalDays: 22,
          usedDays: 0,
          pendingDays: 0,
          carriedOverDays: 0,
        },
      })
    }

    return NextResponse.json({ balance: vacationBalance, requests })
  } catch (error) {
    console.error("Error fetching vacations:", error)
    return NextResponse.json({ error: "Error al obtener vacaciones" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || !session.user.employeeId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { startDate, endDate, reason } = body

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Fechas requeridas" }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start > end) {
      return NextResponse.json({ error: "La fecha de inicio debe ser anterior a la fecha de fin" }, { status: 400 })
    }

    // Calculate business days
    let totalDays = 0
    const current = new Date(start)
    while (current <= end) {
      const dayOfWeek = current.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        totalDays++
      }
      current.setDate(current.getDate() + 1)
    }

    // Check balance
    const currentYear = new Date().getFullYear()
    const balance = await db.vacationBalance.findUnique({
      where: {
        employeeId_year: {
          employeeId: session.user.employeeId,
          year: currentYear,
        },
      },
    })

    const available = balance
      ? balance.totalDays + balance.carriedOverDays - balance.usedDays - balance.pendingDays
      : 0

    if (totalDays > available) {
      return NextResponse.json(
        { error: `Solo tienes ${available} días disponibles` },
        { status: 400 }
      )
    }

    // Create request
    const vacationRequest = await db.vacationRequest.create({
      data: {
        employeeId: session.user.employeeId,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        status: "PENDING",
      },
    })

    // Update pending days
    if (balance) {
      await db.vacationBalance.update({
        where: { id: balance.id },
        data: { pendingDays: { increment: totalDays } },
      })
    }

    // Notify admins
    const admins = await db.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
    })

    const employee = await db.employeeProfile.findUnique({
      where: { id: session.user.employeeId },
    })

    await Promise.all(
      admins.map((admin) =>
        db.notification.create({
          data: {
            userId: admin.id,
            type: "VACATION_REQUEST",
            title: "Nueva solicitud de vacaciones",
            message: `${employee?.firstName} ${employee?.lastName} ha solicitado ${totalDays} días de vacaciones`,
            link: "/admin/vacations",
          },
        })
      )
    )

    return NextResponse.json(vacationRequest)
  } catch (error) {
    console.error("Error creating vacation request:", error)
    return NextResponse.json({ error: "Error al crear solicitud" }, { status: 500 })
  }
}
