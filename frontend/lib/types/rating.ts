export interface TicketRating {
  id: number
  ticket_id: number
  resolution_cycle?: number
  employee_id: number | null
  agent_id: number | null
  rating: number
  feedback: string | null
  created_at: string
}

export interface TicketRatingStatus {
  ticket_id: number
  rating: TicketRating | null
}

export interface AgentRatingStats {
  agent_id: number
  average_rating: number | null
  total_ratings: number
}
