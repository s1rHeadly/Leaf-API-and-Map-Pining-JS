import { getElement, randomNumber, months, validNumber } from "./utils.js";

(function () {
  "use strict";

  /*
  ==============================
  Workout Class (Base Class)
  ==============================
  This class is the foundation for all workout types.
  It holds shared properties like coordinates, distance, duration, date, and ID.
  The _setDescription() method generates a readable label for the workout.
  */
  class Workout {
    date = new Date();
    id = +Date.now().toString().slice(-6);

    constructor(coords, distance, duration) {
      this.coords = coords; // [lat, lng]
      this.distance = distance; // in km
      this.duration = duration; // in minutes
      this._setDescription(); // automatically generate description
    }

    _setDescription() {
      const calendarMonths = months;
      this.description = `${this.date.getDate()} ${
        calendarMonths[this.date.getMonth()]
      } ${this.date.getFullYear()}`;
    }
  }

  /*
  ==============================
  Running Class (Child of Workout)
  ==============================
  Adds cadence and pace calculation specific to running workouts.
  */
  class Running extends Workout {
    type = "running";

    constructor(coords, distance, duration, cadence) {
      super(coords, distance, duration);
      this.cadence = cadence;
      this.calcPace();
    }

    calcPace() {
      this.pace = this.duration / (this.distance / 60);
    }
  }

  /*
  ==============================
  Cycling Class (Child of Workout)
  ==============================
  Adds elevation gain and speed calculation specific to cycling workouts.
  */
  class Cycling extends Workout {
    type = "cycling";

    constructor(coords, distance, duration, elevationGain) {
      super(coords, distance, duration);
      this.elevationGain = elevationGain;
      this.calcSpeed();
    }

    calcSpeed() {
      this.speed = this.distance / this.duration;
    }
  }

  // Testing instantiations
  const running1 = new Running([45, -12], 5.7, 4.8, 455);
  const cycling1 = new Cycling([35, -34], 8, 23, 120);
  console.log({ running1, cycling1 });

  /*
  ==============================
  App Class (Main UI and State Handler)
  ==============================
  Manages DOM elements, map setup, form submission, and application state.
  */
  class App {
    #locations = []; // Private list of all workouts

    constructor() {
      // DOM Targets
      this.form = getElement("form");
      this.containerWorkouts = getElement(".workouts");
      this.inputType = getElement(".form__input--type");
      this.inputDistance = getElement(".form__input--distance");
      this.inputDuration = getElement(".form__input--duration");
      this.inputCadence = getElement(".form__input--cadence");
      this.inputElevation = getElement(".form__input--elevation");
      this.mapEl = getElement("#map");

      // App-level State
      this.currentLat = null;
      this.currentLong = null;
      this.map = null;
      this.lastClickedPosition = null;
      this.isWorkoutValid = false;

      // App Bootstrapping
      this._init();
    }

    async _init() {
      try {
        const { lat, long } = await this._getCurrentLocation();
        this.currentLat = lat;
        this.currentLong = long;

        this._initialiseMap({ currentLat: lat, currentLong: long });
      } catch (error) {
        console.log("Location error:", error);
      }

      this._eventHandlers();
    }

    async _getCurrentLocation() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject("Geolocation is not supported by this browser.");
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const long = position.coords.longitude;
            resolve({ lat, long });
          },
          (error) => reject(error.message)
        );
      });
    }

    _initialiseMap({ currentLat, currentLong }) {
      const currentLocation = [currentLat, currentLong];

      this.map = L.map(this.mapEl).setView(currentLocation, 13);

      L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(this.map);
    }

    _addMarkers(workout) {
      const { coords, description, type } = workout;
      L.marker(coords)
        .addTo(this.map)
        .bindPopup(
          L.popup({
            autoClose: false,
            closeOnClick: false,
            className: `${type}-popup`,
          }).setContent(
            `<p>${
              type.charAt(0).toUpperCase() + type.slice(1)
            } ${description}</p>`
          )
        )
        .openPopup();
    }

    _onHandleMapClick(e) {
      if (this.form.classList.contains("hidden")) {
        this.form.classList.remove("hidden");
        this._updateSelect({ target: this.inputType });
      }

      this.inputDistance.focus();
      const { latlng } = e;
      this.lastClickedPosition = [latlng.lat, latlng.lng];
    }

    _updateSelect(e) {
      const value = e.target.value;

      const cadenceRow = this.inputCadence.closest(".form__row");
      const elevationRow = this.inputElevation.closest(".form__row");

      cadenceRow.classList.remove("form__row--hidden");
      elevationRow.classList.remove("form__row--hidden");

      const selected = {
        cycling: elevationRow,
        running: cadenceRow,
      };

      if (selected[value]) {
        selected[value].classList.add("form__row--hidden");
      }
    }

    _eventHandlers() {
      if (this.map) {
        this.map.on("click", this._onHandleMapClick.bind(this));
      }
      this.form.addEventListener("submit", this._submitNewWorkout.bind(this));
      this.inputType.addEventListener("change", this._updateSelect.bind(this));
    }

    _resetForm() {
      this.inputDistance.value = "";
      this.inputDuration.value = "";
      this.inputCadence.value = "";
      this.inputElevation.value = "";
      this.form.classList.add("hidden");
    }

    _validateWorkoutData() {
      const distance = +this.inputDistance.value;
      const duration = +this.inputDuration.value;
      const cadence = +this.inputCadence.value;
      const elevation = +this.inputElevation.value;
      const type = this.inputType.value;

      if (!validNumber(distance, duration)) {
        alert("Please enter positive numbers for distance and duration.");
        return false;
      }

      if (type === "running" && !validNumber(elevation)) {
        alert("Please enter a positive number for cadence.");
        return false;
      }

      if (type === "cycling" && !validNumber(cadence)) {
        alert("Please enter a positive number for elevation gain.");
        return false;
      }

      if (!this.lastClickedPosition) {
        alert("Please click on the map to select a location.");
        return false;
      }

      return true;
    }

    _submitNewWorkout(e) {
      e.preventDefault();

      if (!this._validateWorkoutData()) return;

      const type = this.inputType.value;
      const distance = +this.inputDistance.value;
      const duration = +this.inputDuration.value;
      const cadence = +this.inputCadence.value;
      const elevation = +this.inputElevation.value;

      let workout;

      if (type === "running") {
        workout = new Running(
          this.lastClickedPosition,
          distance,
          duration,
          cadence
        );
      } else if (type === "cycling") {
        workout = new Cycling(
          this.lastClickedPosition,
          distance,
          duration,
          elevation
        );
      }

      this.#locations.push(workout);
      this._addMarkers(workout);
      this._resetForm();
    }
  }

  // App instantiation for development access
  const initialLoad = new App();
  window.app = initialLoad;
})();
