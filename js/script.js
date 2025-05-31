import { getElement, randomNumber, months } from "./utils.js";
(function () {
  "use strict";

  /*
  =============
  DOM Targets
  =============
  */
  const form = getElement("form");
  const containerWorkouts = getElement(".workouts");
  const inputType = getElement(".form__input--type");
  const inputDistance = getElement(".form__input--distance");
  const inputDuration = getElement(".form__input--duration");
  const inputCadence = getElement(".form__input--cadence");
  const inputElevation = getElement(".form__input--elevation");
  const mapEl = getElement("#map");

  /*
  ================
  Globals 
  ================
  */

  let currentLat, currentLong; // used for populating lat and lang when the page loads
  let map; // when the leaflet map object gets populated then we can use it elsewhere
  let lastClickedPosition = null;
  let clickedLocations = [];

  /*
  ================
  Functions
  ================
  */

  function getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation is not supported by this browser.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const long = position.coords.longitude;
          resolve({ lat, long }); // return pure values
        },
        (error) => {
          reject(error.message);
        }
      );
    });
  }

  function initialiseMap(options) {
    const { currentLat, currentLong } = options;
    const currentLocation = [currentLat, currentLong];

    // set the leafletmap
    map = L.map(mapEl, {
      closePopupOnClick: false,
      markerZoomAnimation: true,
    }).setView(currentLocation, 13);
    // console.log({map}); => the leaflet map object

    // set the initial leaflet tileLayer which is 'Open Street Map'
    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
  }

  /*
  ================
  Events
  ================
  */

  function addMarkers(options) {
    const position = options.position;
    const text = options.placeholder;
    // add the leaflet marker chain
    L.marker(position, {
      riseOnHover: true,
      keyboard: true,
    })
      .addTo(map)
      .bindPopup(
        L.popup({
          autoClose: false,
          closeOnClick: false,
          maxWidth: 250,
          minWidth: 100,
          className: "running-popup",
        }).setContent(`<p>${text}</p>`)
      )
      .openPopup();
  }

  function onHandleMapClick(e) {
    /* remove the class of hidden from the form if it exists */
    form.classList.contains("hidden") && form.classList.remove("hidden");

    /* immediately focus on the inputDistance form field */
    inputDistance.focus();

    /* get our values froim the event */
    const { latlng } = e;
    const clickedLat = latlng?.lat;
    const clickedLong = latlng?.lng;

    /* add marker to map */
    lastClickedPosition = [clickedLat, clickedLong];

    /* add marker postions to clickedLocations */
    const positionClicked = {
      lat: clickedLat,
      long: clickedLong,
    };

    // data gets sent to the form
    clickedLocations.push(positionClicked);

    /* Log the whole array */
    console.log("All clicked locations:", clickedLocations);
  }

  function onFormSumbission(e) {
    e.preventDefault();
    if (!lastClickedPosition) {
      alert("Please click on the map to select a location.");
      return;
    }

    addMarkers({
      position: lastClickedPosition,
      placeholder: "some dummy text for now",
    });
  }

  /* MAIN EVENT HANDLER FUNCTION */
  function eventHandlers() {
    if (map) {
      map.on("click", onHandleMapClick); // this on click event is leaflet specific
    }

    form.addEventListener("submit", (e) => onFormSumbission(e));
  } /*CLOSE MAIN EVENT HANDLER FUNCTION */

  async function init() {
    try {
      const { lat, long } = await getCurrentLocation();
      currentLat = lat;
      currentLong = long;
      // evoke the map and once that promise is resolved with the at and long, pass the values back to where this function is created
      initialiseMap({
        currentLat,
        currentLong,
      });

      console.log({ currentLat, currentLong });
    } catch (error) {
      console.log("Location error:", error);
    }

    eventHandlers();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
