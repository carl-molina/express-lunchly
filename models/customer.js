"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, middleName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.middleName = middleName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  get notes() {
    return this._notes;
  }

  set notes(notes) {
    if (!notes) {
      this._notes = '';
    }
    else {
      this._notes = notes;
    }
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
      [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get a customer by a search for name */

  static async getByName(searchText) {
    console.log('running getByName. search text:', searchText)
    const results = await db.query(
      `SELECT id,
              first_name AS "firstName",
              last_name  AS "lastName",
              phone,
              notes
       FROM customers
       WHERE CONCAT(first_name, ' ', last_name) ILIKE $1
       ORDER BY last_name, first_name`,
       [`%${searchText}%`]
    );
    return results.rows.map(c => new Customer(c));
  }

  /** queries database to find top 10 customers w/ most reservations, sorts
   *  from most reservations to lowest within 10 customers
   */

  static async getTopTen() {
    const results = await db.query(
    `SELECT c.id,
              c.first_name AS "firstName",
              c.last_name  AS "lastName",
              c.phone,
              c.notes,
              COUNT(r.customer_id)
       FROM customers AS c
          JOIN reservations AS r ON r.customer_id = c.id
        GROUP BY c.id
        ORDER BY COUNT(r.customer_id) DESC
        LIMIT 10`);

      return results.rows.map(c => new Customer(c));
  }

  /** get first name and last name of customer */

  get fullName() {
    if (this.middleName) {
      return `${this.firstName} ${this.middleName} ${this.lastName}`
    }
    else {
      return `${this.firstName} ${this.lastName}`;
    }

  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
        this.firstName,
        this.lastName,
        this.phone,
        this.notes,
        this.id,
      ],
      );
    }
  }
}

module.exports = Customer;
