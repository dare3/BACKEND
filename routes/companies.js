"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");
const companySearchSchema = require("../schemas/companySearch.json");

const router = express.Router();  // Initialize express router

/** Helper function to validate JSON schema */
function validateSchema(data, schema) {
  const validator = jsonschema.validate(data, schema);
  if (!validator.valid) {
    const errors = validator.errors.map(e => e.stack);
    throw new BadRequestError(errors);
  }
}

/** POST / { company } => { company }
 *
 * Adds a new company.
 * company should be { handle, name, description, numEmployees, logoUrl }
 * Returns { handle, name, description, numEmployees, logoUrl }
 * 
 * Authorization required: admin
 */
router.post("/", ensureAdmin, async (req, res, next) => {
  try {
    validateSchema(req.body, companyNewSchema);
    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (case-insensitive, partial match)
 * 
 * Authorization required: none
 */
router.get("/", async (req, res, next) => {
  try {
    const { minEmployees, maxEmployees, ...query } = req.query;

    if (minEmployees !== undefined && isNaN(parseInt(minEmployees))) {
      return next(new BadRequestError("minEmployees must be a number"));
    }

    if (maxEmployees !== undefined && isNaN(parseInt(maxEmployees))) {
      return next(new BadRequestError("maxEmployees must be a number"));
    }

    const filters = {
      ...query,
      minEmployees: minEmployees ? parseInt(minEmployees, 10) : undefined,
      maxEmployees: maxEmployees ? parseInt(maxEmployees, 10) : undefined,
    };

    validateSchema(filters, companySearchSchema);
    const companies = await Company.findAll(filters);
    return res.json({ companies });
  } catch (err) {
    return next(err);
  }
});

/** GET /[handle]  =>  { company }
 * 
 * Returns specific company details by handle.
 * Company is { handle, name, description, numEmployees, logoUrl, jobs }
 * where jobs is [{ id, title, salary, equity }, ...]
 * 
 * Authorization required: none
 */
router.get("/:handle", async (req, res, next) => {
  try {
    const company = await Company.get(req.params.handle);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 * 
 * Updates company data. Fields can be: { name, description, numEmployees, logoUrl }
 * Returns updated company: { handle, name, description, numEmployees, logoUrl }
 * 
 * Authorization required: admin
 */
router.patch("/:handle", ensureAdmin, async (req, res, next) => {
  try {
    validateSchema(req.body, companyUpdateSchema);
    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 * 
 * Deletes a company by handle.
 * Returns { deleted: handle }
 * 
 * Authorization required: admin
 */
router.delete("/:handle", ensureAdmin, async (req, res, next) => {
  try {
    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
