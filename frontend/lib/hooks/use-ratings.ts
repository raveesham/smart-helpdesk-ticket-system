"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  fetchAgentRatingStats,
  fetchTicketRating,
  submitRating,
} from "@/lib/services/rating.service"
import type { RatingCreateInput } from "@/lib/schemas"

export function useTicketRating(ticketId: number) {
  return useQuery({
    queryKey: ["rating", ticketId],
    queryFn: () => fetchTicketRating(ticketId),
    enabled: Number.isFinite(ticketId) && ticketId > 0,
  })
}

export function useSubmitRating(ticketId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RatingCreateInput) =>
      submitRating(ticketId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["rating", ticketId],
      })
    },
  })
}

export function useAgentRatingStats(
  agentId: number | null,
  enabled = true,
) {
  return useQuery({
    queryKey: ["agent-rating-stats", agentId],
    queryFn: () => fetchAgentRatingStats(agentId!),
    enabled: enabled && agentId !== null && agentId > 0,
  })
}
