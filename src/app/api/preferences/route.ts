import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || !session.user.employeeId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get("year") || "")
    const month = parseInt(searchParams.get("month") || "")

    if (!year || !month) {
      return NextResponse.json(
        { error: "Se requieren año y mes" },
        { status: 400 }
      )
    }

    // Buscar el periodo
    const period = await db.preferencePeriod.findUnique({
      where: { year_month: { year, month } },
    })

    if (!period) {
      return NextResponse.json({ period: null, entries: [] })
    }

    // Obtener las preferencias del usuario
    const entries = await db.preferenceEntry.findMany({
      where: {
        periodId: period.id,
        employeeId: session.user.employeeId,
      },
      include: {
        shiftType: true,
      },
    })

    return NextResponse.json({ period, entries })
  } catch (error) {
    console.error("Error fetching preferences:", error)
    return NextResponse.json(
      { error: "Error al obtener preferencias" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || !session.user.employeeId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { year, month, entries } = body

    if (!year || !month || !entries) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    // Buscar el periodo
    let period = await db.preferencePeriod.findUnique({
      where: { year_month: { year, month } },
    })

    if (!period) {
      return NextResponse.json(
        { error: "El periodo de preferencias no está abierto" },
        { status: 400 }
      )
    }

    // Verificar que el periodo está abierto
    if (period.status !== "OPEN") {
      return NextResponse.json(
        { error: "El periodo de preferencias está cerrado" },
        { status: 400 }
      )
    }

    // Verificar deadline
    if (period.deadline && new Date() > period.deadline) {
      return NextResponse.json(
        { error: "Se ha pasado la fecha límite para enviar preferencias" },
        { status: 400 }
      )
    }

    // Eliminar preferencias anteriores del usuario para este periodo
    await db.preferenceEntry.deleteMany({
      where: {
        periodId: period.id,
        employeeId: session.user.employeeId,
      },
    })

    // Crear nuevas preferencias
    const createdEntries = await db.preferenceEntry.createMany({
      data: entries.map((entry: { date: string; shiftTypeId: string; preferenceLevel: number }) => ({
        periodId: period!.id,
        employeeId: session.user.employeeId!,
        date: new Date(entry.date),
        shiftTypeId: entry.shiftTypeId,
        preferenceLevel: entry.preferenceLevel,
      })),
    })

    return NextResponse.json({
      success: true,
      count: createdEntries.count,
    })
  } catch (error) {
    console.error("Error saving preferences:", error)
    return NextResponse.json(
      { error: "Error al guardar preferencias" },
      { status: 500 }
    )
  }
}
