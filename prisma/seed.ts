import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Limpiar datos existentes
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.message.deleteMany()
  await prisma.deviationRecord.deleteMany()
  await prisma.employeeMetrics.deleteMany()
  await prisma.shiftChangeResult.deleteMany()
  await prisma.changeApproval.deleteMany()
  await prisma.coverageOffer.deleteMany()
  await prisma.shiftChangeRequest.deleteMany()
  await prisma.scheduleEntry.deleteMany()
  await prisma.schedulePeriod.deleteMany()
  await prisma.preferenceEntry.deleteMany()
  await prisma.preferencePeriod.deleteMany()
  await prisma.shiftRequirement.deleteMany()
  await prisma.shiftType.deleteMany()
  await prisma.holiday.deleteMany()
  await prisma.employeeRestriction.deleteMany()
  await prisma.employeeProfile.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.verificationToken.deleteMany()
  await prisma.user.deleteMany()
  await prisma.systemConfig.deleteMany()

  // Crear tipos de turno
  console.log("Creating shift types...")
  const shiftTypes = await Promise.all([
    prisma.shiftType.create({
      data: {
        code: "M",
        name: "Mañana",
        description: "Turno de mañana",
        startTime: "07:00",
        endTime: "15:00",
        durationHours: 8,
        color: "#22C55E",
        isPenalty: false,
        penaltyWeight: 1.0,
        sortOrder: 1,
      },
    }),
    prisma.shiftType.create({
      data: {
        code: "T",
        name: "Tarde",
        description: "Turno de tarde",
        startTime: "15:00",
        endTime: "23:00",
        durationHours: 8,
        color: "#F59E0B",
        isPenalty: false,
        penaltyWeight: 1.0,
        sortOrder: 2,
      },
    }),
    prisma.shiftType.create({
      data: {
        code: "N",
        name: "Noche",
        description: "Turno de noche",
        startTime: "23:00",
        endTime: "07:00",
        durationHours: 8,
        color: "#6366F1",
        isPenalty: true,
        penaltyWeight: 1.5,
        sortOrder: 3,
      },
    }),
    prisma.shiftType.create({
      data: {
        code: "G",
        name: "Guardia 24h",
        description: "Guardia de 24 horas",
        startTime: "08:00",
        endTime: "08:00",
        durationHours: 24,
        color: "#EF4444",
        isPenalty: true,
        penaltyWeight: 2.0,
        sortOrder: 4,
      },
    }),
    prisma.shiftType.create({
      data: {
        code: "L",
        name: "Libranza",
        description: "Día libre",
        startTime: null,
        endTime: null,
        durationHours: 0,
        color: "#9CA3AF",
        isPenalty: false,
        penaltyWeight: 0,
        sortOrder: 5,
      },
    }),
    prisma.shiftType.create({
      data: {
        code: "V",
        name: "Vacaciones",
        description: "Día de vacaciones",
        startTime: null,
        endTime: null,
        durationHours: 0,
        color: "#14B8A6",
        isPenalty: false,
        penaltyWeight: 0,
        sortOrder: 6,
      },
    }),
  ])

  console.log("Creating users...")
  const passwordHash = await bcrypt.hash("password123", 10)

  // Crear admin
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@shiftbalance.com",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
      employeeProfile: {
        create: {
          employeeCode: "ADM001",
          firstName: "Admin",
          lastName: "Principal",
          department: "Administración",
          position: "Administrador del Sistema",
          hireDate: new Date("2020-01-01"),
        },
      },
    },
  })

  // Crear trabajadores
  const workers = await Promise.all([
    prisma.user.create({
      data: {
        email: "maria.garcia@shiftbalance.com",
        passwordHash,
        role: "WORKER",
        status: "ACTIVE",
        emailVerified: new Date(),
        employeeProfile: {
          create: {
            employeeCode: "EMP001",
            firstName: "María",
            lastName: "García",
            department: "Operaciones",
            position: "Técnico",
            hireDate: new Date("2021-03-15"),
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: "carlos.lopez@shiftbalance.com",
        passwordHash,
        role: "WORKER",
        status: "ACTIVE",
        emailVerified: new Date(),
        employeeProfile: {
          create: {
            employeeCode: "EMP002",
            firstName: "Carlos",
            lastName: "López",
            department: "Operaciones",
            position: "Técnico Senior",
            hireDate: new Date("2019-06-01"),
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: "ana.martinez@shiftbalance.com",
        passwordHash,
        role: "WORKER",
        status: "ACTIVE",
        emailVerified: new Date(),
        employeeProfile: {
          create: {
            employeeCode: "EMP003",
            firstName: "Ana",
            lastName: "Martínez",
            department: "Operaciones",
            position: "Técnico",
            hireDate: new Date("2022-01-10"),
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: "pedro.ruiz@shiftbalance.com",
        passwordHash,
        role: "WORKER",
        status: "ACTIVE",
        emailVerified: new Date(),
        employeeProfile: {
          create: {
            employeeCode: "EMP004",
            firstName: "Pedro",
            lastName: "Ruiz",
            department: "Operaciones",
            position: "Técnico",
            hireDate: new Date("2021-09-01"),
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: "laura.sanchez@shiftbalance.com",
        passwordHash,
        role: "WORKER",
        status: "ACTIVE",
        emailVerified: new Date(),
        employeeProfile: {
          create: {
            employeeCode: "EMP005",
            firstName: "Laura",
            lastName: "Sánchez",
            department: "Operaciones",
            position: "Técnico",
            hireDate: new Date("2023-02-15"),
          },
        },
      },
    }),
  ])

  // Obtener perfiles de empleados
  const employeeProfiles = await prisma.employeeProfile.findMany()

  // Crear periodo de preferencias para el mes actual
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  console.log("Creating preference period...")
  const preferencePeriod = await prisma.preferencePeriod.create({
    data: {
      year: currentYear,
      month: currentMonth,
      status: "OPEN",
      opensAt: new Date(currentYear, currentMonth - 2, 15),
      deadline: new Date(currentYear, currentMonth - 1, 20),
    },
  })

  // Crear periodo de horario para el mes actual
  console.log("Creating schedule period...")
  const schedulePeriod = await prisma.schedulePeriod.create({
    data: {
      year: currentYear,
      month: currentMonth,
      status: "PUBLISHED",
      publishedAt: new Date(currentYear, currentMonth - 1, 25),
    },
  })

  // Generar horarios de ejemplo
  console.log("Creating schedule entries...")
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
  const morningShift = shiftTypes.find((s) => s.code === "M")!
  const afternoonShift = shiftTypes.find((s) => s.code === "T")!
  const nightShift = shiftTypes.find((s) => s.code === "N")!
  const dayOffShift = shiftTypes.find((s) => s.code === "L")!

  const shifts = [morningShift, afternoonShift, nightShift, dayOffShift]

  for (const profile of employeeProfiles.slice(0, 5)) {
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth - 1, day)
      // Asignar turno rotativo basado en el día y empleado
      const shiftIndex = (day + employeeProfiles.indexOf(profile)) % shifts.length
      const shift = shifts[shiftIndex]

      await prisma.scheduleEntry.create({
        data: {
          schedulePeriodId: schedulePeriod.id,
          employeeId: profile.id,
          date,
          shiftTypeId: shift.id,
        },
      })
    }
  }

  // Crear algunas preferencias de ejemplo
  console.log("Creating preference entries...")
  const workerProfiles = employeeProfiles.filter((p) => p.userId !== adminUser.id)

  for (const profile of workerProfiles.slice(0, 3)) {
    for (let day = 1; day <= Math.min(10, daysInMonth); day++) {
      const date = new Date(currentYear, currentMonth - 1, day)
      const level = [0, 25, 50, 75, 100][Math.floor(Math.random() * 5)]

      await prisma.preferenceEntry.create({
        data: {
          periodId: preferencePeriod.id,
          employeeId: profile.id,
          date,
          preferenceLevel: level,
        },
      })
    }
  }

  // Crear notificaciones de ejemplo
  console.log("Creating notifications...")
  for (const worker of workers.slice(0, 3)) {
    await prisma.notification.create({
      data: {
        userId: worker.id,
        type: "SCHEDULE_PUBLISHED",
        title: "Horario publicado",
        message: `El horario de ${new Date(currentYear, currentMonth - 1, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" })} ha sido publicado`,
        link: "/worker/schedule",
      },
    })
  }

  // Crear configuración del sistema
  console.log("Creating system config...")
  await prisma.systemConfig.createMany({
    data: [
      { key: "preferences.default_level", value: 50, description: "Nivel de preferencia por defecto" },
      { key: "preferences.deadline_days_before", value: 10, description: "Días antes del mes para cerrar preferencias" },
      { key: "schedule.min_rest_hours", value: 12, description: "Horas mínimas de descanso entre turnos" },
      { key: "schedule.max_consecutive_days", value: 6, description: "Máximo días consecutivos de trabajo" },
      { key: "changes.require_admin_approval", value: true, description: "Requiere aprobación admin para cambios" },
      { key: "changes.valid_hours", value: 72, description: "Horas de validez para solicitud de cambio" },
      { key: "scoring.collaboration_weight", value: 0.4, description: "Peso de colaboración en score" },
      { key: "scoring.load_weight", value: 0.35, description: "Peso de carga en score" },
      { key: "scoring.fairness_weight", value: 0.25, description: "Peso de justicia en score" },
    ],
  })

  console.log("Seed completed!")
  console.log("\nTest accounts:")
  console.log("- Admin: admin@shiftbalance.com / password123")
  console.log("- Worker: maria.garcia@shiftbalance.com / password123")
  console.log("- Worker: carlos.lopez@shiftbalance.com / password123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
