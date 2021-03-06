const express = require("express");
const axios = require("axios");
const router = express.Router();
const cache = require("../scripts/cache");
const config = require("../../../config");

router.get("/", (req, res) => {
  res.status(501).json({ error: "not implemented" });
});

router.get("/official", (req, res) => official_events(req, res));
router.get("/official/id/:id", (req, res) => official_event_by_id(req, res));

async function official_events(req, res) {
  let key = "official_events"; // cache key

  let from = parseInt(req.query.from);
  let to = parseInt(req.query.to);

  if (cache.get(key)) {
    let all_events = cache.get(key);

    let filtered_events = filterByDate(all_events.events, from, to);

    let unique_events = Array.from(
      new Set(filtered_events.map((e) => e.id))
    ).map((id) => {
      return filtered_events.find((e) => e.id === id);
    });

    return res.status(200).json({ events: unique_events });
  } else {
    return res.status(500).json({ error: "internal server error" });
  }
}

async function official_event_by_id(req, res) {
  try {
    var json = (
      await fetch(
        `https://api.brussels:443/api/agenda/0.0.1/events/${req.params.id}`
      )
    ).data;
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "internal server error" });
  }

  return res.status(200).json(json);
}

/**
 * filter events depending on the date
 * @param events an array of events
 * @param from date in Unix Epoch time
 * @param to date in Unix Epoch time
 */
function filterByDate(events, from, to) {
  let filtered_events = events.filter((item) => {
    // if event.data_next is between from and to, then include it
    if (item.date_next) {
      let next_date = new Date(item.date_next);
      let next_time = next_date.getTime() / 1000;
      return from < next_time && next_time < to;
    }
    return false;
  });
  return filtered_events;
}

function fetch(url) {
  const options = {
    headers: {
      Authorization: getAPIKey(),
      Accept: "application/json",
    },
  };
  return axios.get(url, options);
}

function getAPIKey() {
  return config.env.APIBRUSSELS_API_KEY;
}

module.exports = router;
