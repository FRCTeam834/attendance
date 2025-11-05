<script>
  import { onMount } from "svelte";

  let canvas;
  let ctx;
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  let attendanceData = [];
  let loading = false;
  let selectedName = "Select User";

  const submitAttendance = async (action) => {
    if (selectedName === "Select User") {
      alert("Please select a user first.");
      return;
    }
    loading = true;
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedName, action })
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else {
        alert(data.message);
        await loadAttendance();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to reach the server.");
    } finally {
      loading = false;
    }
  };

  const loadAttendance = async () => {
    try {
      const res = await fetch("/api/attendance");
      attendanceData = await res.json();
    } catch (err) {
      console.error("Failed to load attendance data:", err);
    }
  };

  onMount(loadAttendance);

  const initCanvas = () => {
    ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#000";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 2;
  };

  const getPosition = (e) => {
    const rect = canvas.getBoundingClientRect();
    let x, y;
    if (e.touches) {
      const t = e.touches[0];
      x = t.clientX - rect.left;
      y = t.clientY - rect.top;
    } else {
      x = e.offsetX;
      y = e.offsetY;
    }
    return { x, y };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    isDrawing = true;
    const { x, y } = getPosition(e);
    [lastX, lastY] = [x, y];
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    [lastX, lastY] = [x, y];
  };

  const stopDrawing = () => { isDrawing = false; };
  const clearCanvas = () => ctx.clearRect(0, 0, canvas.width, canvas.height);

  onMount(initCanvas);

  const names = [
    "Select User",
    "Dominic Veneziale","Julia Meaney","Vamu Srinivasan","Vedu Srinivasan","Varu Srinivasan",
    "Matthew Aung","Gabe Magwood","Kyler Mooney","Maddie Oswald","Cooper Morgan","Joey Kohler",
    "Mason Gildein","Krupa Dihora","Yusef Seyed","John Coult","Mark Hernandez Guerra","Dylan Braverman",
    "Jackson Burmeister","Karsten Immerzeal","Stanley Wempe","Victor Bodea","Alez Gualfieri","Ani Hari",
    "Aubrey Cressnan","Ben Snyder","Conner Male","Daytona Christman","Daniel Kim","Emma Husvar",
    "Geo Jung","Grace Russell","Grant Hufgard","Isabella O.A.","Jake Tsyvine","Jayee Lin","Joey Kholer",
    "John Cult","Karsten Immerzeel","Manas Pol","Matthew Ryan","Myles Bartholomew","Paytuna A.",
    "Quinn Ham","Ritwika Veeravalli","Sebastian Velez","Trace Willaims","Vaaman Srinivasan",
    "Vanessa Trbuza","Varahan Srinivasan","Vedanth Srinivasan","Yusef Syed","Akshaya Guduru","Anand Kunnath"
  ];
</script>

<div class="container">
  <div class="card">
    <h1 class="title">SparTechs Attendance</h1>

    <label>Member</label><br />
    <select bind:value={selectedName} disabled={loading} class="select">
      {#each names as n}
        <option value={n}>{n}</option>
      {/each}
    </select>

    <div class="spacer-sm"></div>

    <button on:click={() => submitAttendance("Sign In")} disabled={loading} class="btn">
      {loading ? "Processing..." : "Sign In"}
    </button>
    <span class="gap"></span>
    <button on:click={() => submitAttendance("Sign Out")} disabled={loading} class="btn">
      {loading ? "Processing..." : "Sign Out"}
    </button>

    <div class="spacer"></div>

    <canvas
      bind:this={canvas}
      width="600"
      height="300"
      on:mousedown={startDrawing}
      on:mousemove={draw}
      on:mouseup={stopDrawing}
      on:mouseleave={stopDrawing}
      on:touchstart={startDrawing}
      on:touchmove={draw}
      on:touchend={stopDrawing}
      on:touchcancel={stopDrawing}
    ></canvas>
    <br />
    <button on:click={clearCanvas} class="btn">Clear</button>

    <div class="spacer"></div>

    <h2 class="subtitle">Recent Activity</h2>
    <table class="table">
      <thead>
        <tr><th>When</th><th>Name</th><th>Action</th></tr>
      </thead>
      <tbody>
        {#each attendanceData as row}
          <tr>
            <td>{new Date(row.ts).toLocaleString()}</td>
            <td>{row.name}</td>
            <td>{row.action}</td>
          </tr>
        {/each}
        {#if attendanceData.length === 0}
          <tr><td colspan="3">No entries yet.</td></tr>
        {/if}
      </tbody>
    </table>
  </div>
</div>

<style>
  :root {
    --bg: #0b1020;
    --panel: #111a33;
    --text: #f1f5f9;
    --btn: #2563eb;
  }
  html, body, #app { height: 100%; margin: 0; }
  body { background: var(--bg); color: var(--text); font-family: system-ui, sans-serif; }
  .container { max-width: 960px; margin: 0 auto; padding: 24px; }
  .card { background: var(--panel); border-radius: 14px; padding: 20px; box-shadow: 0 10px 24px rgba(0,0,0,.25); }
  .title { margin: 0 0 8px 0; }
  .subtitle { margin: 0 0 8px 0; }
  .select { margin-top: 6px; min-width: 260px; padding: 6px 8px; border-radius: 8px; }
  .btn { background: var(--btn); color: white; border: 0; border-radius: 8px; padding: 8px 12px; cursor: pointer; }
  .btn[disabled] { opacity: 0.6; cursor: not-allowed; }
  .gap { display:inline-block; width: 8px; }
  .spacer-sm { height: 10px; }
  .spacer { height: 24px; }
  .table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  .table th, .table td { text-align: left; padding: 8px; }
  .table tr:nth-child(even) { background: rgba(255,255,255,0.06); }
  canvas { border: 8px solid #ffffff; background-color: rgb(65, 105, 225); cursor: crosshair; margin-top: 20px; }
</style>
