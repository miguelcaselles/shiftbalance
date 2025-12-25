import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: params.id },
      include: {
        employeeProfile: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Error al obtener usuario" },
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
    const { email, password, role, status, firstName, lastName, position, department } = body

    // Verificar que el usuario existe
    const existing = await db.user.findUnique({
      where: { id: params.id },
      include: { employeeProfile: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Preparar datos de actualización del usuario
    const userData: Record<string, unknown> = {}
    if (email) userData.email = email
    if (role) userData.role = role
    if (status) userData.status = status
    if (password) userData.passwordHash = await bcrypt.hash(password, 10)

    // Actualizar usuario
    const user = await db.user.update({
      where: { id: params.id },
      data: userData,
    })

    // Actualizar perfil de empleado si existe
    if (existing.employeeProfile) {
      const profileData: Record<string, unknown> = {}
      if (firstName) profileData.firstName = firstName
      if (lastName) profileData.lastName = lastName
      if (position !== undefined) profileData.position = position
      if (department !== undefined) profileData.department = department

      if (Object.keys(profileData).length > 0) {
        await db.employeeProfile.update({
          where: { id: existing.employeeProfile.id },
          data: profileData,
        })
      }
    }

    const updatedUser = await db.user.findUnique({
      where: { id: params.id },
      include: { employeeProfile: true },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
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

    // No permitir eliminarse a sí mismo
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propia cuenta" },
        { status: 400 }
      )
    }

    // En lugar de eliminar, desactivar el usuario
    await db.user.update({
      where: { id: params.id },
      data: { status: "INACTIVE" },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    )
  }
}
