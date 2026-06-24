import { streamText } from 'ai';
import { google } from '@ai-sdk/google'; // Puedes cambiarlo por openai() o mistral() si prefieres
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Inicializar el cliente de Supabase con tus variables de entorno de Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: google('gemini-1.5-flash'), // Excelente balance entre velocidad, costo y "tool calling"
    messages,
    system: `Eres el asistente inteligente del punto de venta (POS) del negocio. 
             Tienes acceso en tiempo real a la base de datos de Supabase para consultar inventario y ventas.
             Sé profesional, conciso y responde siempre en español.`,
    
    // Aquí defines las herramientas (Tools) del protocolo MCP
    tools: {
      // HERRAMIENTA 1: Consultar el stock en Supabase
      consultarStockInsumo: {
        description: 'Busca la cantidad disponible de un producto o insumo en el inventario por su nombre.',
        parameters: z.object({
          nombreProducto: z.string().describe('El nombre o palabra clave del producto/insumo a buscar'),
        }),
        execute: async ({ nombreProducto }) => {
          // Consulta directa a tu tabla de Supabase
          const { data, error } = await supabase
            .from('productos') // El nombre de tu tabla en Supabase
            .select('nombre, stock, precio')
            .ilike('nombre', `%${nombreProducto}%`); // Búsqueda flexible (case-insensitive)

          if (error) return { error: 'No se pudo consultar la base de datos.' };
          if (!data || data.length === 0) return { mensaje: 'No se encontró ningún producto con ese nombre.' };

          return { productos: data };
        },
      },

      // HERRAMIENTA 2: Resumen de ventas del día
      obtenerVentasDelDia: {
        description: 'Calcula el total de ventas generadas durante el día de hoy.',
        parameters: z.object({}), // No requiere parámetros del usuario
        execute: async () => {
          const hoy = new Date().toISOString().split('T')[0];

          const { data, error } = await supabase
            .from('ventas') // Tu tabla de registros de ventas
            .select('total')
            .gte('creado_en', `${hoy}T00:00:00`)
            .lte('creado_en', `${hoy}T23:59:59`);

          if (error) return { error: 'Error al calcular las ventas.' };
          
          const totalVendido = data.reduce((sum, venta) => sum + (venta.total || 0), 0);
          return { fecha: hoy, transacciones: data.length, total: totalVendido };
        },
      },
    },
  });

  return result.toDataStreamResponse();
}