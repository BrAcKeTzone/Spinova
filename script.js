class SpinTheWheel {
  constructor() {
    this.canvas = document.getElementById("wheelCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.options = [];
    // Modern, clean color palette - cycles for up to 50 options
    this.colors = [
      "#374151", // slate-700
      "#475569", // slate-600
      "#334155", // slate-700 (alternate)
      "#6366F1", // indigo-500
      "#2563EB", // blue-600 (primary)
      "#3B82F6", // blue-500
      "#06B6D4", // cyan-500
      "#0891B2", // cyan-600
      "#0ea5a4", // teal-500
      "#10B981", // green-500
      "#84CC16", // lime-400
      "#F59E0B", // amber-500
      "#F97316", // orange-500
      "#EF4444", // red-500
      "#D946EF", // fuchsia-500
      "#8B5CF6", // violet-500
    ];
    this.isSpinning = false;
    this.currentRotation = 0;
    this.statistics = {};
    this.selectionMode = false;
    this.selectedOptions = new Set();
    this.currentWinner = null;
    this.highlightIndex = null;
    this.highlightStartTime = null;
    this.highlightDuration = 1600; // ms
    this.highlightProgress = 0;

    this.initializeElements();
    this.bindEvents();
    this.loadSavedWheels();
    this.loadStatistics();
    this.loadSettings();
    this.drawWheel();

    // read CSS variables for consistent theme usage
    const computed = getComputedStyle(document.documentElement);
    this.cssVars = {
      textDark: computed.getPropertyValue("--text-dark") || "#0f172a",
      textLight: computed.getPropertyValue("--text-light") || "#e6eef6",
      primary: computed.getPropertyValue("--primary") || "#2563EB",
    };

    // Add some default options if none exist
    if (this.options.length === 0) {
      this.addDefaultOptions();
    }
  }

  initializeElements() {
    this.optionInput = document.getElementById("optionInput");
    this.addOptionBtn = document.getElementById("addOption");
    this.optionsList = document.getElementById("optionsList");
    this.spinBtn = document.getElementById("spinButton");
    this.resultText = document.getElementById("resultText");
    this.resultDisplay = document.getElementById("resultDisplay");
    this.clearAllBtn = document.getElementById("clearAll");
    this.saveWheelBtn = document.getElementById("saveWheel");
    this.loadWheelBtn = document.getElementById("loadWheel");
    this.savedWheelsContainer = document.getElementById("savedWheels");
    this.statsDisplay = document.getElementById("statsDisplay");
    this.clearStatsBtn = document.getElementById("clearStats");

    // Bulk selection elements
    this.toggleSelectionBtn = document.getElementById("toggleSelection");
    this.bulkControls = document.getElementById("bulkControls");
    this.selectAllBtn = document.getElementById("selectAll");
    this.deselectAllBtn = document.getElementById("deselectAll");
    this.removeSelectedBtn = document.getElementById("removeSelected");
    this.selectedCount = document.getElementById("selectedCount");

    // Settings elements
    this.removeAfterWinCheckbox = document.getElementById("removeAfterWin");

    // Modal elements
    this.saveModal = document.getElementById("saveModal");
    this.wheelNameInput = document.getElementById("wheelName");
    this.confirmSaveBtn = document.getElementById("confirmSave");
    this.cancelSaveBtn = document.getElementById("cancelSave");
    this.closeModal = document.querySelector(".close");

    // Remove winner modal elements
    this.removeWinnerModal = document.getElementById("removeWinnerModal");
    this.winnerColorDisplay = document.getElementById("winnerColorDisplay");
    this.winnerNameDisplay = document.getElementById("winnerNameDisplay");
    this.removeWinnerBtn = document.getElementById("removeWinner");
    this.keepWinnerBtn = document.getElementById("keepWinner");

    // Toast
    this.toast = document.getElementById("toast");
    this.toastMessage = document.getElementById("toastMessage");
  }

  bindEvents() {
    this.addOptionBtn.addEventListener("click", () => this.addOption());
    this.optionInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.addOption();
    });

    this.spinBtn.addEventListener("click", () => this.spin());
    this.clearAllBtn.addEventListener("click", () => this.clearAllOptions());
    this.saveWheelBtn.addEventListener("click", () => this.showSaveModal());
    this.loadWheelBtn.addEventListener("click", () => this.showLoadOptions());
    this.clearStatsBtn.addEventListener("click", () => this.clearStatistics());

    // Bulk selection events
    this.toggleSelectionBtn.addEventListener("click", () =>
      this.toggleSelectionMode()
    );
    this.selectAllBtn.addEventListener("click", () => this.selectAllOptions());
    this.deselectAllBtn.addEventListener("click", () =>
      this.deselectAllOptions()
    );
    this.removeSelectedBtn.addEventListener("click", () =>
      this.removeSelectedOptions()
    );

    // Modal events
    this.confirmSaveBtn.addEventListener("click", () => this.saveWheel());
    this.cancelSaveBtn.addEventListener("click", () => this.hideSaveModal());
    this.closeModal.addEventListener("click", () => this.hideSaveModal());

    // Close modal when clicking outside
    this.saveModal.addEventListener("click", (e) => {
      if (e.target === this.saveModal) this.hideSaveModal();
    });

    // Remove winner modal events
    this.removeWinnerBtn.addEventListener("click", () =>
      this.confirmRemoveWinner()
    );
    this.keepWinnerBtn.addEventListener("click", () =>
      this.hideRemoveWinnerModal()
    );

    // Close remove winner modal when clicking outside
    this.removeWinnerModal.addEventListener("click", (e) => {
      if (e.target === this.removeWinnerModal) this.hideRemoveWinnerModal();
    });

    // Settings events
    this.removeAfterWinCheckbox.addEventListener("change", () =>
      this.saveSettings()
    );
  }

  addDefaultOptions() {
    const defaultOptions = ["Option 1", "Option 2", "Option 3", "Option 4"];
    defaultOptions.forEach((option) => {
      this.options.push({
        text: option,
        color: this.colors[this.options.length % this.colors.length],
      });
    });
    this.updateOptionsDisplay();
    this.drawWheel();
  }

  addOption() {
    const textInput = this.optionInput.value.trim();
    if (textInput === "") {
      this.showToast("Please enter an option", "error");
      return;
    }

    // Split input by newlines and filter out empty lines
    const optionsToAdd = textInput
      .split("\n")
      .map((text) => text.trim())
      .filter((text) => text !== "");

    let addedCount = 0;
    let duplicateCount = 0;

    for (const text of optionsToAdd) {
      // Check for duplicates
      if (
        this.options.some(
          (option) => option.text.toLowerCase() === text.toLowerCase()
        )
      ) {
        duplicateCount++;
        continue;
      }

      // Check if we've reached the maximum limit
      if (this.options.length >= 50) {
        this.showToast(
          `Maximum limit of 50 options reached. Added ${addedCount} options.`,
          "warning"
        );
        break;
      }

      const option = {
        text: text,
        color: this.colors[this.options.length % this.colors.length],
      };

      this.options.push(option);
      addedCount++;
    }

    this.optionInput.value = "";
    this.updateOptionsDisplay();
    this.drawWheel();

    if (addedCount > 0) {
      this.showToast(
        `Successfully added ${addedCount} option${addedCount > 1 ? "s" : ""}${
          duplicateCount > 0
            ? `. ${duplicateCount} duplicate${
                duplicateCount > 1 ? "s" : ""
              } skipped.`
            : ""
        }`,
        "success"
      );
    } else if (duplicateCount > 0) {
      this.showToast(
        `No new options added. ${duplicateCount} duplicate${
          duplicateCount > 1 ? "s" : ""
        } found.`,
        "warning"
      );
    }
  }

  removeOption(index) {
    if (this.isSpinning) return;

    this.options.splice(index, 1);
    this.selectedOptions.clear(); // Clear selections when removing individual options
    this.updateOptionsDisplay();
    this.drawWheel();
    this.showToast("Option removed", "info");
  }

  toggleSelectionMode() {
    if (this.isSpinning) return;

    this.selectionMode = !this.selectionMode;
    this.selectedOptions.clear();

    if (this.selectionMode) {
      this.toggleSelectionBtn.innerHTML =
        '<i class="fas fa-times"></i> Exit Select';
      this.toggleSelectionBtn.className = "btn btn-danger";
      this.bulkControls.style.display = "block";
      this.bulkControls.classList.add("active");
      this.showToast(
        "Selection mode enabled - click options to select",
        "info"
      );
    } else {
      this.toggleSelectionBtn.innerHTML =
        '<i class="fas fa-check-square"></i> Select Mode';
      this.toggleSelectionBtn.className = "btn btn-primary";
      this.bulkControls.style.display = "none";
      this.bulkControls.classList.remove("active");
      this.showToast("Selection mode disabled", "info");
    }

    this.updateOptionsDisplay();
  }

  toggleOption(index) {
    if (!this.selectionMode || this.isSpinning) return;

    if (this.selectedOptions.has(index)) {
      this.selectedOptions.delete(index);
    } else {
      this.selectedOptions.add(index);
    }

    this.updateOptionsDisplay();
  }

  selectAllOptions() {
    if (!this.selectionMode || this.isSpinning) return;

    this.selectedOptions.clear();
    for (let i = 0; i < this.options.length; i++) {
      this.selectedOptions.add(i);
    }

    this.updateOptionsDisplay();
    this.showToast(`Selected all ${this.options.length} options`, "success");
  }

  deselectAllOptions() {
    if (!this.selectionMode || this.isSpinning) return;

    this.selectedOptions.clear();
    this.updateOptionsDisplay();
    this.showToast("Deselected all options", "info");
  }

  removeSelectedOptions() {
    if (
      !this.selectionMode ||
      this.isSpinning ||
      this.selectedOptions.size === 0
    )
      return;

    const selectedCount = this.selectedOptions.size;
    const remainingCount = this.options.length - selectedCount;

    if (remainingCount < 2) {
      this.showToast(
        "Cannot remove selected options - at least 2 options must remain",
        "error"
      );
      return;
    }

    if (
      !confirm(
        `Remove ${selectedCount} selected option${
          selectedCount > 1 ? "s" : ""
        }?`
      )
    ) {
      return;
    }

    // Convert Set to Array and sort in descending order to avoid index issues
    const sortedIndices = Array.from(this.selectedOptions).sort(
      (a, b) => b - a
    );

    // Remove options from highest index to lowest
    sortedIndices.forEach((index) => {
      this.options.splice(index, 1);
    });

    this.selectedOptions.clear();
    this.updateOptionsDisplay();
    this.drawWheel();
    this.showToast(
      `Removed ${selectedCount} option${selectedCount > 1 ? "s" : ""}`,
      "success"
    );
  }

  updateSelectedCount() {
    if (this.selectedCount) {
      const count = this.selectedOptions.size;
      this.selectedCount.textContent = `${count} selected`;

      // Enable/disable remove button based on selection
      if (this.removeSelectedBtn) {
        this.removeSelectedBtn.disabled =
          count === 0 || this.options.length - count < 2;
      }
    }
  }

  updateOptionsDisplay() {
    this.optionsList.innerHTML = "";

    this.options.forEach((option, index) => {
      const optionItem = document.createElement("div");
      optionItem.className = `option-item ${
        this.selectionMode ? "selection-mode" : ""
      } ${this.selectedOptions.has(index) ? "selected" : ""}`;

      if (this.selectionMode) {
        optionItem.innerHTML = `
                <input type="checkbox" class="option-checkbox" ${
                  this.selectedOptions.has(index) ? "checked" : ""
                } onchange="wheel.toggleOption(${index})">
                <div class="option-color" style="background-color: ${
                  option.color
                }"></div>
                <span class="option-text">${option.text}</span>
            `;
        optionItem.addEventListener("click", (e) => {
          if (e.target.type !== "checkbox") {
            this.toggleOption(index);
          }
        });
      } else {
        optionItem.innerHTML = `
                <div class="option-color" style="background-color: ${option.color}"></div>
                <span class="option-text">${option.text}</span>
                <button class="remove-option" onclick="wheel.removeOption(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
      }

      this.optionsList.appendChild(optionItem);
    });

    // If options changed while highlighting, ensure highlight remains valid
    if (
      this.highlightIndex !== null &&
      this.highlightIndex >= this.options.length
    ) {
      this.highlightIndex = null;
      this.highlightStartTime = null;
      this.highlightProgress = 0;
    }

    this.updateSelectedCount();
  }

  drawWheel() {
    if (this.options.length === 0) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = "#f0f0f0";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.fillStyle = "#666";
      this.ctx.font = "20px Roboto";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        "Add options to start",
        this.canvas.width / 2,
        this.canvas.height / 2
      );
      return;
    }

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const anglePerSlice = (2 * Math.PI) / this.options.length;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw wheel segments
    this.options.forEach((option, index) => {
      const startAngle = index * anglePerSlice + this.currentRotation;
      const endAngle = (index + 1) * anglePerSlice + this.currentRotation;

      // Draw slice
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      this.ctx.lineTo(centerX, centerY);
      this.ctx.fillStyle = option.color;
      this.ctx.fill();

      // Draw border
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      this.ctx.lineTo(centerX, centerY);
      this.ctx.strokeStyle = "#fff";
      this.ctx.lineWidth = 3;
      this.ctx.stroke();

      // Draw text
      const textAngle = startAngle + anglePerSlice / 2;
      const textRadius = radius * 0.7;
      const textX = centerX + Math.cos(textAngle) * textRadius;
      const textY = centerY + Math.sin(textAngle) * textRadius;

      this.ctx.save();
      this.ctx.translate(textX, textY);
      this.ctx.rotate(textAngle + Math.PI / 2);

      this.ctx.fillStyle = "#fff";
      this.ctx.font = "bold 14px Roboto";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";

      // Text shadow for better visibility
      this.ctx.strokeStyle = "rgba(0,0,0,0.5)";
      this.ctx.lineWidth = 3;
      this.ctx.strokeText(option.text, 0, 0);
      this.ctx.fillText(option.text, 0, 0);

      this.ctx.restore();

      // If this slice is being highlighted, draw a pulsing overlay and glow
      if (this.highlightIndex === index) {
        const now = Date.now();
        const elapsed = this.highlightStartTime
          ? now - this.highlightStartTime
          : 0;
        const progress = Math.min(elapsed / this.highlightDuration, 1);

        // Pulsing alpha using sine wave (0 -> 0.35)
        const pulse = Math.sin(progress * Math.PI * 2);
        const alpha = 0.35 * (0.5 + 0.5 * pulse);

        // Overlay to brighten the wedge
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        this.ctx.lineTo(centerX, centerY);
        this.ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        this.ctx.fill();
        this.ctx.restore();

        // Glow outline around the outer edge of the slice
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius + 6, startAngle, endAngle);
        this.ctx.lineWidth = 10;
        this.ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.8})`;
        this.ctx.stroke();
        this.ctx.restore();
      }
    });

    // Draw center circle (use CSS var for consistent color on chosen theme)
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    this.ctx.fillStyle = this.cssVars ? this.cssVars.textDark : "#333";
    this.ctx.fill();
  }

  spin() {
    if (this.isSpinning || this.options.length === 0) return;

    if (this.options.length < 2) {
      this.showToast("Add at least 2 options to spin", "error");
      return;
    }

    // Exit selection mode when spinning starts
    if (this.selectionMode) {
      this.toggleSelectionMode();
    }

    this.isSpinning = true;
    this.spinBtn.disabled = true;
    this.spinBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i><span>SPINNING</span>';

    // Generate random spin (relative to current rotation)
    const minSpins = 5;
    const maxSpins = 10;
    const spins = Math.random() * (maxSpins - minSpins) + minSpins;
    const randomOffset = Math.random() * 2 * Math.PI;
    const finalRotation =
      this.currentRotation + spins * 2 * Math.PI + randomOffset;

    // Reset any existing highlight
    this.highlightIndex = null;
    this.highlightStartTime = null;
    this.highlightProgress = 0;

    // Animate spin - compute the winner after animation based on the
    // final rotation and the pointer position (top of the wheel)
    this.animateSpin(finalRotation);
  }

  animateSpin(finalRotation) {
    const startRotation = this.currentRotation;
    const totalRotation = finalRotation - startRotation;
    const duration = 4000; // 4 seconds
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (cubic-bezier)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      this.currentRotation = startRotation + totalRotation * easeOut;
      this.drawWheel();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // compute the winner based on final currentRotation
        const normalizedRotation =
          ((this.currentRotation % (2 * Math.PI)) + 2 * Math.PI) %
          (2 * Math.PI);

        // normalize stored rotation so it doesn't grow unbounded across multiple spins
        this.currentRotation = normalizedRotation;
        const anglePerSlice = (2 * Math.PI) / this.options.length;
        const pointerAngle = -Math.PI / 2; // pointer points up at 12 o'clock

        // find the slice that covers the pointer angle
        let winningIndex = Math.floor(
          (pointerAngle - normalizedRotation) / anglePerSlice
        );

        // normalize index to range 0..len-1
        winningIndex =
          ((winningIndex % this.options.length) + this.options.length) %
          this.options.length;
        const winner = this.options[winningIndex];

        // start highlight animation for the winning slice
        this.highlightIndex = winningIndex;
        this.highlightStartTime = Date.now();
        this.highlightDuration = 1600;
        this.highlightProgress = 0;
        this.animateHighlight();

        this.onSpinComplete(winner);
      }
    };

    requestAnimationFrame(animate);
  }

  onSpinComplete(winner) {
    this.isSpinning = false;
    this.spinBtn.disabled = false;
    this.spinBtn.innerHTML = '<i class="fas fa-play"></i><span>SPIN</span>';

    // Store current winner
    this.currentWinner = winner;

    // Update result display
    this.resultText.textContent = winner.text;
    this.resultDisplay.classList.add("winner");

    // Update statistics
    this.updateStatistics(winner.text);

    // Show celebration
    setTimeout(() => {
      this.resultDisplay.classList.remove("winner");
    }, 2000);

    this.showToast(`Winner: ${winner.text}`, "success");

    // Check if user wants to remove winner after spin
    if (this.removeAfterWinCheckbox.checked && this.options.length > 2) {
      setTimeout(() => {
        this.showRemoveWinnerModal(winner);
      }, 2500); // Show modal after celebration ends
    }
  }

  updateStatistics(winner) {
    if (!this.statistics[winner]) {
      this.statistics[winner] = 0;
    }
    this.statistics[winner]++;
    this.saveStatistics();
    this.displayStatistics();
  }

  displayStatistics() {
    this.statsDisplay.innerHTML = "";

    if (Object.keys(this.statistics).length === 0) {
      this.statsDisplay.innerHTML =
        '<p style="text-align: center; color: #718096;">No spins yet</p>';
      return;
    }

    // Sort by count (descending)
    const sortedStats = Object.entries(this.statistics).sort(
      (a, b) => b[1] - a[1]
    );

    sortedStats.forEach(([option, count]) => {
      const statItem = document.createElement("div");
      statItem.className = "stat-item";
      statItem.innerHTML = `
                <span class="stat-name">${option}</span>
                <span class="stat-count">${count}</span>
            `;
      this.statsDisplay.appendChild(statItem);
    });
  }

  clearAllOptions() {
    if (this.isSpinning) return;

    if (this.options.length === 0) return;

    if (confirm("Are you sure you want to remove all options?")) {
      this.options = [];
      this.selectedOptions.clear();
      this.updateOptionsDisplay();
      this.drawWheel();
      this.resultText.textContent = "Add options and spin!";
      this.resultDisplay.classList.remove("winner");
      this.showToast("All options cleared", "info");
    }
  }

  showSaveModal() {
    if (this.options.length === 0) {
      this.showToast("Add options before saving", "error");
      return;
    }

    this.saveModal.style.display = "block";
    this.wheelNameInput.focus();
  }

  hideSaveModal() {
    this.saveModal.style.display = "none";
    this.wheelNameInput.value = "";
  }

  saveWheel() {
    const name = this.wheelNameInput.value.trim();
    if (name === "") {
      this.showToast("Please enter a wheel name", "error");
      return;
    }

    const savedWheels = this.getSavedWheels();
    if (savedWheels[name]) {
      if (!confirm("A wheel with this name already exists. Overwrite?")) {
        return;
      }
    }

    savedWheels[name] = {
      options: [...this.options],
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem("spinWheelSavedWheels", JSON.stringify(savedWheels));
    this.loadSavedWheels();
    this.hideSaveModal();
    this.showToast(`Wheel "${name}" saved successfully`, "success");
  }

  getSavedWheels() {
    const saved = localStorage.getItem("spinWheelSavedWheels");
    return saved ? JSON.parse(saved) : {};
  }

  loadSavedWheels() {
    const savedWheels = this.getSavedWheels();
    this.savedWheelsContainer.innerHTML = "";

    if (Object.keys(savedWheels).length === 0) {
      this.savedWheelsContainer.innerHTML =
        '<p style="text-align: center; color: #718096;">No saved wheels</p>';
      return;
    }

    Object.entries(savedWheels).forEach(([name, data]) => {
      const wheelItem = document.createElement("div");
      wheelItem.className = "saved-wheel-item";
      wheelItem.innerHTML = `
                <span class="saved-wheel-name">${name}</span>
                <span class="saved-wheel-count">${data.options.length} options</span>
                <button class="delete-saved-wheel" onclick="wheel.deleteSavedWheel('${name}')">
                    <i class="fas fa-trash"></i>
                </button>
            `;

      wheelItem.addEventListener("click", (e) => {
        if (
          !e.target.classList.contains("delete-saved-wheel") &&
          !e.target.classList.contains("fas")
        ) {
          this.loadWheel(name, data);
        }
      });

      this.savedWheelsContainer.appendChild(wheelItem);
    });
  }

  loadWheel(name, data) {
    if (this.isSpinning) return;

    this.options = [...data.options];
    this.selectedOptions.clear();
    this.updateOptionsDisplay();
    this.drawWheel();
    this.resultText.textContent = "Wheel loaded! Click spin to start!";
    this.resultDisplay.classList.remove("winner");
    this.showToast(`Wheel "${name}" loaded successfully`, "success");
  }

  deleteSavedWheel(name) {
    if (confirm(`Delete wheel "${name}"?`)) {
      const savedWheels = this.getSavedWheels();
      delete savedWheels[name];
      localStorage.setItem("spinWheelSavedWheels", JSON.stringify(savedWheels));
      this.loadSavedWheels();
      this.showToast(`Wheel "${name}" deleted`, "info");
    }
  }

  showLoadOptions() {
    const savedWheels = this.getSavedWheels();
    if (Object.keys(savedWheels).length === 0) {
      this.showToast("No saved wheels found", "info");
      return;
    }
    this.showToast("Click on a saved wheel to load it", "info");
  }

  saveStatistics() {
    localStorage.setItem(
      "spinWheelStatistics",
      JSON.stringify(this.statistics)
    );
  }

  loadStatistics() {
    const saved = localStorage.getItem("spinWheelStatistics");
    this.statistics = saved ? JSON.parse(saved) : {};
    this.displayStatistics();
  }

  clearStatistics() {
    if (Object.keys(this.statistics).length === 0) {
      this.showToast("No statistics to clear", "info");
      return;
    }

    if (
      confirm(
        "Are you sure you want to clear all statistics? This action cannot be undone."
      )
    ) {
      this.statistics = {};
      this.saveStatistics();
      this.displayStatistics();
      this.showToast("All statistics cleared", "success");
    }
  }

  loadSettings() {
    const saved = localStorage.getItem("spinWheelSettings");
    if (saved) {
      const settings = JSON.parse(saved);
      this.removeAfterWinCheckbox.checked = settings.removeAfterWin || false;
    }
  }

  saveSettings() {
    const settings = {
      removeAfterWin: this.removeAfterWinCheckbox.checked,
    };
    localStorage.setItem("spinWheelSettings", JSON.stringify(settings));

    if (this.removeAfterWinCheckbox.checked) {
      this.showToast("Will ask to remove winners after spinning", "info");
    } else {
      this.showToast("Winners will stay on wheel after spinning", "info");
    }
  }

  showRemoveWinnerModal(winner) {
    // Find the winner's index in the current options
    const winnerIndex = this.options.findIndex(
      (option) => option.text === winner.text && option.color === winner.color
    );

    if (winnerIndex === -1) return; // Winner not found (shouldn't happen)

    // Update modal content
    this.winnerColorDisplay.style.backgroundColor = winner.color;
    this.winnerNameDisplay.textContent = winner.text;

    // Store winner index for removal
    this.winnerToRemoveIndex = winnerIndex;

    // Show modal
    this.removeWinnerModal.style.display = "block";
  }

  hideRemoveWinnerModal() {
    this.removeWinnerModal.style.display = "none";
    this.winnerToRemoveIndex = null;
  }

  confirmRemoveWinner() {
    if (this.winnerToRemoveIndex !== null && this.options.length > 2) {
      const removedOption = this.options[this.winnerToRemoveIndex];

      // Remove the winner from options
      this.options.splice(this.winnerToRemoveIndex, 1);

      // Clear any selections that might be affected
      this.selectedOptions.clear();

      // Update display and redraw wheel
      this.updateOptionsDisplay();
      this.drawWheel();

      // Show confirmation
      this.showToast(`"${removedOption.text}" removed from wheel`, "info");
    }

    this.hideRemoveWinnerModal();
  }

  showToast(message, type = "info") {
    this.toastMessage.textContent = message;
    this.toast.className = `toast ${type} show`;

    setTimeout(() => {
      this.toast.classList.remove("show");
    }, 3000);
  }

  animateHighlight() {
    if (this.highlightIndex === null) return;

    const now = Date.now();
    const elapsed = now - (this.highlightStartTime || now);
    const progress = Math.min(elapsed / this.highlightDuration, 1);
    this.highlightProgress = progress;

    // Redraw wheel to reflect highlight progress
    this.drawWheel();

    if (progress < 1) {
      requestAnimationFrame(() => this.animateHighlight());
    } else {
      // End of highlight animation
      this.highlightIndex = null;
      this.highlightStartTime = null;
      this.highlightProgress = 0;
      this.drawWheel();
    }
  }

  // Public helper - compute which index would be selected given a rotation
  computeWinnerIndexFromRotation(rotation) {
    if (this.options.length === 0) return -1;
    const normalizedRotation =
      ((rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const anglePerSlice = (2 * Math.PI) / this.options.length;
    const pointerAngle = -Math.PI / 2;
    let winningIndex = Math.floor(
      (pointerAngle - normalizedRotation) / anglePerSlice
    );
    winningIndex =
      ((winningIndex % this.options.length) + this.options.length) %
      this.options.length;
    return winningIndex;
  }
}

// Initialize the wheel when the page loads
let wheel;
document.addEventListener("DOMContentLoaded", () => {
  wheel = new SpinTheWheel();
});

// Handle window resize
window.addEventListener("resize", () => {
  if (wheel) {
    wheel.drawWheel();
  }
});

// Service Worker Registration for offline functionality
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}
