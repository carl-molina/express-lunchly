"use strict";

/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  get numGuests() {
    return this._numGuests;
  }

  set numGuests(numGuests) {
    if (numGuests < 1) {
      throw new Error("Reservation must have at least 1 guest.")
    }
    this._numGuests = numGuests
  }

  get startAt() {
    return this._startAt;
  }

  set startAt(startAt) {
    if (isNaN(startAt)) {
      throw new Error("Must set start date to a value that's a Date object");
    }
    else {
      this._startAt = startAt;
    }
  }

  get customerId() {
    return this._customerId;
  }

  set customerId(customerId) {
    if (this._customerId) {
      throw new Error("Customer id cannot be reassigned");
    }
    this._customerId = customerId;
  }

  /** formatter for startAt */

  getFormattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
          `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1`,
        [customerId],
    );

    return results.rows.map(row => new Reservation(row));
  }

  /** saves reservation edits  */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
            `INSERT INTO reservations (customer_id, num_guests, start_at, notes)
            VALUES ($1, $2, $3, $4)
            RETURNING id`,
          [this.customerId, this.numGuests, this.startAt, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
            `UPDATE reservations
            SET num_guests=$1,
                start_at=$2,
                notes=$3
            WHERE id = $4`, [
            this.numGuests,
            this.startAt,
            this.notes,
            this.id,
          ],
      );
    }
  }
}



module.exports = Reservation;