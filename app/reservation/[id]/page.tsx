"use client";

import { useEffect, useState } from "react";
import {
  useParams,
  useRouter
} from "next/navigation";

export default function ReservationPage() {

    const params = useParams();
    const reservationId = params.id;

  const router = useRouter();

  const [reservation, setReservation] =
    useState<any>(null);

  const [timeLeft, setTimeLeft] =
    useState("");

    const [loading, setLoading] =
  useState(false);

  async function fetchReservation() {

    const response = await fetch(
      `/api/reservations/${reservationId}`
    );

    const data = await response.json();

    if (!response.ok) {

      alert(data.error);

      router.push("/");

      return;
    }

    setReservation(data);
  }

  useEffect(() => {
    fetchReservation();
  }, []);

  useEffect(() => {

    if (!reservation) return;

    const interval = setInterval(() => {

      const now = new Date().getTime();

      const expiry =
        new Date(
          reservation.expires_at
        ).getTime();

      const difference =
        expiry - now;

      if (difference <= 0) {

        setTimeLeft("Expired");

        clearInterval(interval);

        return;
      }

      const minutes = Math.floor(
        difference / 1000 / 60
      );

      const seconds = Math.floor(
        (difference / 1000) % 60
      );

      setTimeLeft(
        `${minutes}m ${seconds}s`
      );

    }, 1000);

    return () => clearInterval(interval);

  }, [reservation]);

  async function confirmReservation() {
    setLoading(true);

    const response = await fetch(
      `/api/reservations/${reservationId}/confirm`,
      {
        method: "POST",
      }
    );

    const data = await response.json();

    alert(data.message || data.error);

    setLoading(false);

    router.push("/");
  }

  async function cancelReservation() {
    setLoading(true);

    const response = await fetch(
      `/api/reservations/${reservationId}/release`,
      {
        method: "POST",
      }
    );

    const data = await response.json();

    alert(data.message || data.error);

    setLoading(false);
    router.push("/");
  }

  if (!reservation) {
    return <div className="p-10">Loading...</div>;
  }

  return (
    <div className="p-10">

      <h1 className="text-3xl font-bold mb-6">
        Reservation Details
      </h1>

      <div className="border p-6 rounded-lg space-y-3">

        <p>
          Product ID:
          {" "}
          {reservation.product_id}
        </p>

        <p>
          Warehouse ID:
          {" "}
          {reservation.warehouse_id}
        </p>

        <p>
          Quantity:
          {" "}
          {reservation.quantity}
        </p>

        <p>
          Status:
          {" "}
          {reservation.status}
        </p>

        <p>
          Expires In:
          {" "}
          {timeLeft}
        </p>

        <div className="flex gap-4 pt-4">

          <button
          disabled={loading}
            onClick={confirmReservation}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Confirm Purchase
          </button>

          <button
          disabled={loading}
            onClick={cancelReservation}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>

        </div>

      </div>
    </div>
  );
}