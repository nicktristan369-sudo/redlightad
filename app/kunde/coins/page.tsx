"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function KundeCoins() {
  const router = useRouter()
  useEffect(() => { router.replace("/kunde/buy-coins") }, [router])
  return null
}
