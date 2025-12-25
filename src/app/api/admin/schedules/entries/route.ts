import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { year, month, entries } = body

    if (!year || !month || !entries) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos" },
        { status: 400 }
      )
    }

    // Obtener o crear el periodo
    let schedulePeriod = await db.schedulePeriod.findUnique({
      where: { year_month: { year, month } },
    })

    if (!schedulePeriod) {
      schedulePeriod = await db.schedulePeriod.create({
        data: {
          year,
          month,
          status: "DRAFT",
        },
      })
    }

    // Verificar que el periodo esté en estado DRAFT
    if (schedulePeriod.status !== "DRAFT") {
      return NextResponse.json(
        { error: "El periodo no está en borrador y no se puede editar" },
        { status: 400 }
      )
    }

    // Procesar cada entrada
    for (const entry of entries) {
      const { employeeId, date, shiftTypeId } = entry
      const entryDate = new Date(date)

      if (shiftTypeId === null) {
        // Eliminar entrada si existe
        await db.scheduleEntry.deleteMany({
          where: {
            schedulePeriodId: schedulePeriod.id,
            employeeId,
            date: entryDate,
          },
        })
      } else {
        // Crear o actualizar entrada
        const existing = await db.scheduleEntry.findFirst({
          where: {
            schedulePeriodId: schedulePeriod.id,
            employeeId,
            date: entryDate,
          },
        })

        if (existing) {
          await db.scheduleEntry.update({
            where: { id: existing.id },
            data: { shiftTypeId },
          })
        } else {
          await db.scheduleEntry.create({
            data: {
              schedulePeriodId: schedulePeriod.id,
              employeeId,
              date: entryDate,
              shiftTypeId,
            },
          })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving schedule entries:", error)
    return NextResponse.json(
      { error: "Error al guardar los cambios" },
      { status: 500 }
    )
  }
}
