import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const shifts = await db.shiftType.findMany({
      orderBy: { sortOrder: "asc" },
    })

    return NextResponse.json(shifts)
  } catch (error) {
    console.error("Error fetching shifts:", error)
    return NextResponse.json(
      { error: "Error al obtener turnos" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { code, name, startTime, endTime, color, isPenalty, penaltyWeight, sortOrder } = body

    if (!code || !name || !startTime || !endTime || !color) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    // Verificar si el código ya existe
    const existing = await db.shiftType.findUnique({
      where: { code },
    })

    if (existing) {
      return NextResponse.json(
        { error: "El código de turno ya existe" },
        { status: 400 }
      )
    }

    // Obtener el siguiente sortOrder si no se proporciona
    let finalSortOrder = sortOrder
    if (finalSortOrder === undefined) {
      const lastShift = await db.shiftType.findFirst({
        orderBy: { sortOrder: "desc" },
      })
      finalSortOrder = (lastShift?.sortOrder ?? 0) + 1
    }

    const shift = await db.shiftType.create({
      data: {
        code,
        name,
        startTime,
        endTime,
        color,
        isPenalty: isPenalty ?? false,
        penaltyWeight: penaltyWeight ?? 1.0,
        sortOrder: finalSortOrder,
        isActive: true,
      },
    })

    return NextResponse.json(shift)
  } catch (error) {
    console.error("Error creating shift:", error)
    return NextResponse.json(
      { error: "Error al crear turno" },
      { status: 500 }
    )
  }
}
