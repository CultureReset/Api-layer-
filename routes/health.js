const express = require('express');
const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { error } = await db.from('entity').select('id', { count: 'exact', head: true });
    if (error) throw error;
    res.json({ status: 'ok', database: 'launch gcr', connected: true });
  })
);

module.exports = router;
