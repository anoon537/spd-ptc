    const ids = [
      "requestDate",
      "nopek",
      "name",
      "origin",
      "destination",
      "purpose",
      "departDate",
      "returnDate",
      "hotel",
      "checkin",
      "checkout",
      "accommodationNote",
      "transport",
      "transportNote",
    ];
    const defaults = {
      nopek: "D186-260421",
      name: "Muhammad Mahmuda Prawira",
      origin: "Banyumas",
      destination: "Banyumas",
      purpose:
        "Preventive Maintenance SPBU di Kabupaten Banyumas, tanggal 20 Oktober 2026\nSPBU: 44.531.01, 44.531.38, 44.531.09, 44.531.30",
      transport: "Kendaraan Pribadi",
      transportNote: "Non Residensial",
    };
    const input = (id) => document.getElementById(id);
    const themeToggle = document.getElementById("themeToggle");
    function setTheme(isDark) {
      document.body.classList.toggle("dark-mode", isDark);
      themeToggle.setAttribute("aria-pressed", String(isDark));
      themeToggle.setAttribute("aria-label", isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap");
    }
    let savedTheme = "light";
    try {
      savedTheme = localStorage.getItem("spd-theme") || "light";
    } catch { }
    setTheme(savedTheme === "dark");
    themeToggle.addEventListener("click", () => {
      const isDark = !document.body.classList.contains("dark-mode");
      setTheme(isDark);
      try {
        localStorage.setItem("spd-theme", isDark ? "dark" : "light");
      } catch { }
    });
    function fmt(id) {
      const raw = input(id)?.value || "";
      if (!raw) return "";
      if (input(id).type === "date") {
        const [y, m, d] = raw.split("-");
        return `${d}/${m}/${y}`;
      }
      return raw;
    }
    let purposeDateMode = null;
    function formatLongDate(raw) {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${raw}T00:00:00Z`));
    }
    function syncPurposeDate() {
      const purpose = input("purpose");
      const departDate = input("departDate").value;
      const returnDate = input("returnDate").value;

      if (!departDate && !returnDate) {
        if (purposeDateMode === "inline") {
          purpose.value = purpose.value.replace(/tanggal\s+[^,\n]+/i, "tanggal sesuai jadwal");
        } else if (purposeDateMode === "line") {
          purpose.value = purpose.value.replace(/\n?^Tanggal perjalanan:.*$/im, "").trimEnd();
        }
        purposeDateMode = null;
        return;
      }

      const dateRange = [departDate, returnDate]
        .filter(Boolean)
        .map(formatLongDate)
        .join(" s.d. ");
      const linePattern = /^Tanggal perjalanan:.*$/im;
      if (linePattern.test(purpose.value)) {
        purpose.value = purpose.value.replace(linePattern, `Tanggal perjalanan: ${dateRange}`);
        purposeDateMode = "line";
      } else if (/tanggal\s+[^,\n]+/i.test(purpose.value)) {
        purpose.value = purpose.value.replace(/tanggal\s+[^,\n]+/i, `tanggal ${dateRange}`);
        purposeDateMode = "inline";
      } else {
        const lines = purpose.value.split("\n");
        const firstLine = lines.shift() || "";
        const commaIndex = firstLine.indexOf(",");
        const firstLineWithDate = commaIndex >= 0
          ? `${firstLine.slice(0, commaIndex + 1)} tanggal ${dateRange}${firstLine.slice(commaIndex + 1).trimStart() ? ` ${firstLine.slice(commaIndex + 1).trimStart()}` : ""}`
          : `${firstLine}, tanggal ${dateRange}`;
        purpose.value = [firstLineWithDate, ...lines].join("\n");
        purposeDateMode = "inline";
      }
    }
    function drawDate(el, raw) {
      el.replaceChildren();
      const chars = raw ? raw.split("-").reverse().join("/") : "  /  /    ";
      for (const ch of chars) {
        if (ch === "/") {
          const s = document.createElement("span");
          s.className = "px-1";
          s.textContent = "/";
          el.append(s);
        } else {
          const b = document.createElement("span");
          b.className = "date-digit border border-dark text-center font-monospace";
          b.textContent = ch;
          el.append(b);
        }
      }
    }
    function update() {
      const departDate = input("departDate").value;
      const dateSuffix = departDate ? departDate.split("-").reverse().join("") : "";
      document.title = `Form Permintaan SPD PTC${dateSuffix ? ` ${dateSuffix}` : ""}`;
      document
        .querySelectorAll("[data-out]")
        .forEach((el) => (el.textContent = fmt(el.dataset.out)));
      document
        .querySelectorAll("[data-boxdate]")
        .forEach((el) => drawDate(el, input(el.dataset.boxdate).value));
    }
    ids.forEach((id) => input(id).addEventListener("input", () => {
      if (id === "departDate" || id === "returnDate") syncPurposeDate();
      update();
    }));
    const now = new Date(),
      local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
    input("requestDate").value = local;
    input("departDate").value = "";
    input("returnDate").value = "";
    update();
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => {
        const selectedView = button.dataset.view;
        document.querySelectorAll("[data-panel]").forEach((panel) => {
          panel.classList.toggle("is-active", panel.dataset.panel === selectedView);
        });
        document.querySelectorAll("[data-view]").forEach((viewButton) => {
          const selected = viewButton.dataset.view === selectedView;
          viewButton.classList.toggle("btn-primary", selected);
          viewButton.classList.toggle("btn-outline-primary", !selected);
        });
      });
    });
    document.getElementById("printBtn").onclick = () => window.print();
    document.getElementById("resetBtn").onclick = () => {
      ids.forEach((id) => (input(id).value = defaults[id] || ""));
      purposeDateMode = null;
      update();
    };
