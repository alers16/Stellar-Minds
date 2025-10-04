import { z } from "zod"

import graphDataJson from "@/public/data/graph.json" assert { type: "json" }

const GraphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  community: z.number().nullable(),
  level: z.number().nullable(),
  degree: z.number().nullable(),
})

const GraphEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  weight: z.number().nullable(),
  description: z.string().nullable().optional(),
})

const GraphDataSchema = z.object({
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
})

export type GraphNode = z.infer<typeof GraphNodeSchema>
export type GraphEdge = z.infer<typeof GraphEdgeSchema>
export type GraphData = z.infer<typeof GraphDataSchema>

const parsedGraph = GraphDataSchema.parse(graphDataJson)

export const graphData: GraphData = {
  nodes: parsedGraph.nodes.map((node) => ({
    ...node,
    level: node.level ?? 0,
    degree: node.degree ?? 0,
    community: node.community ?? -1,
  })),
  edges: parsedGraph.edges.map((edge) => ({
    ...edge,
    description: edge.description ?? null,
  })),
}
