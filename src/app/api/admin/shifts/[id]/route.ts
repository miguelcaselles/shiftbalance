import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const shift = await db.shiftType.findUnique({
      where: { id: params.id },
    })

    if (!shift) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 })
    }

    return NextResponse.json(shift)
  } catch (error) {
    console.error("Error fetching shift:", error)
    return NextResponse.json(
      { error: "Error al obtener turno" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { code, name, startTime, endTime, color, isPenalty, penaltyWeight, sortOrder, isActive } = body

    // Verificar que el turno existe
    const existing = await db.shiftType.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 })
    }

    // Si se cambia el código, verificar que no exista
    if (code && code !== existing.code) {
      const codeExists = await db.shiftType.findUnique({
        where: { code },
      })
      if (codeExists) {
        return NextResponse.json(
          { error: "El código de turno ya existe" },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (code !== undefined) updateData.code = code
    if (name !== undefined) updateData.name = name
    if (startTime !== undefined) updateData.startTime = startTime
    if (endTime !== undefined) updateData.endTime = endTime
    if (color !== undefined) updateData.color = color
    if (isPenalty !== undefined) updateData.isPenalty = isPenalty
    if (penaltyWeight !== undefined) updateData.penaltyWeight = penaltyWeight
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder
    if (isActive !== undefined) updateData.isActive = isActive

    const shift = await db.shiftType.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(shift)
  } catch (error) {
    console.error("Error updating shift:", error)
    return NextResponse.json(
      { error: "Error al actualizar turno" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar si el turno está siendo usado
    const usageCount = await db.scheduleEntry.count({
      where: { shiftTypeId: params.id },
    })

    if (usageCount > 0) {
      // En lugar de eliminar, desactivar
      await db.shiftType.update({
        where: { id: params.id },
        data: { isActive: false },
      })
      return NextResponse.json({
        success: true,
        message: "El turno ha sido desactivado porque tiene asignaciones existentes"
      })
    }

    // Si no tiene uso, eliminar
    await db.shiftType.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting shift:", error)
    return NextResponse.json(
      { error: "Error al eliminar turno" },
      { status: 500 }
    )
  }
}
