import { getElement, randomNumber, months } from "./utils.js";
(function () {
  "use strict";

  // prettier-ignore
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const form = getElement("form");
  const containerWorkouts = getElement(".workouts");
  const inputType = getElement(".form__input--type");
  const inputDistance = getElement(".form__input--distance");
  const inputDuration = getElement(".form__input--duration");
  const inputCadence = getElement(".form__input--cadence");
  const inputElevation = getElement(".form__input--elevation");
  let currentLat, currentLong;

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

  async function init() {
    try {
      const { lat, long } = await getCurrentLocation();
      currentLat = lat;
      currentLong = long;

      console.log("Latitude:", currentLat);
      console.log("Longitude:", currentLong);
    } catch (error) {
      console.log("Location error:", error);
    }
  }

  window.addEventListener("DOMContentLoaded", init);
})();
