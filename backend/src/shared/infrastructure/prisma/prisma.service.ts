import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from "@nestjs/common";
import { PrismaClient } from '@/../generated/prisma/client'
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { Pool } from 'pg';


@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        // Pool de conexiones para que no haya arranque en frío (cold start) en cada petición
        const connectionString = process.env.DATABASE_URL;

        /** 
         * Configuración del Pool de Conexiones (Arquitectura Fail-Fast)
         * ------------------------------------------------------------------
         * connectionTimeoutMillis: 5000 (5s)
         * MOTIVO: En picos de tráfico (ej. deadlines de congresos), si el Pool se llena,
         * es vital rechazar conexiones nuevas rápido ("Fail Fast") en lugar de encolarlas
         * indefinidamente.
         * 
         * Timeout ALTO (>20s): Provoca efecto "bola de nieve". Las peticiones en espera 
         * consumen RAM de Node.js y pueden tumbar el servidor completo por agotamiento de recursos.
         * Timeout BAJO (5s): Protege la estabilidad del sistema. Si no hay sitio en 5s,
         * liberamos recursos y el usuario puede reintentar, pero el servidor sigue vivo.
         * 
         * max (conexiones máximas en el pool):
         * Se calcula visualizando el número de conexiones disponibles en la base de datos postgres,
         * menos las conexiones vivas cuando arrancamos la aplicación:
         * SHOW max_connections;
         * SELECT count(*) FROM pg_stat_activity;
         * SELECT pid, usename, application_name, state, query  FROM pg_stat_activity  WHERE datname = current_database();
        */
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,

            max: 85,


            idleTimeoutMillis: 10000,
            connectionTimeoutMillis: 5000,
        });

        // Adaptador en Node que sustituye al de Rust, mejor rendimiento
        const adapter = new PrismaPg(pool);
        super({ adapter });
    }

    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('✅ Successfully connected to database');
        } catch (error) {
            this.logger.error('❌ Failed to connect to database', error);
            throw error;
        }
    }

    async onModuleDestroy() {
        try {
            await this.$disconnect();
            this.logger.log('✅ Disconnected from database');
        } catch (error) {
            this.logger.error('❌ Error disconnecting from database', error);
        }
    }

    async enableShutdownHooks(app: any) {
        process.on('beforeExit', async () => {
            await app.close();
        });
    }
}