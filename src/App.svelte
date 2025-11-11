<script>
  import { onMount } from "svelte";
  const API_BASE = 'http://localhost:3000';

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
        body: JSON.stringify({ name: selectedName, action }),
      });

      const data = await res.json();
      console.log(data);

      if (data.error) {
        alert(data.error);
      } else {
        alert(data.message);
        await loadAttendance();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to the server.");
    } finally {
      loading = false;
    }
  };

  const loadAttendance = async () => {
    try {
      const res = await fetch("/api/attendance");
      const data = await res.json();
      attendanceData = data;
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
      const touch = e.touches[0];
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
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

  const stopDrawing = () => {
    isDrawing = false;
  };

  const clearCanvas = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  onMount(initCanvas);
</script>

<!-- ============== YOUR DECORATIVE IMAGES (unchanged) ============== -->
<a href="https://imgbb.com/">
  <img
    src="https://i.ibb.co/84sq5Ykm/Adobe-Express-file-1.png"
    alt="Flower image"
    style="width: 125px; height: auto; position: absolute; top: 150px; left: 450px;"
  />
</a>

<img
  src="https://i.ibb.co/84sq5Ykm/Adobe-Express-file-1.png"
  alt="Flower Image"
  style="width: 115px; height: auto; position: absolute; top: 550px; left: 350px;"
/>

<img
  src="https://i.ibb.co/84sq5Ykm/Adobe-Express-file-1.png"
  alt="Flower Image"
  style="width: 150px; height: auto; position: absolute; top: 625px; left: 430px; transform: rotate(45deg);"
/>

<img
  src="https://i.ibb.co/84sq5Ykm/Adobe-Express-file-1.png"
  alt="Flower Image"
  style="width: 75px; height: auto; position: absolute; top: 650px; left: 1150px;"
/>

<img
  src="https://i.ibb.co/84sq5Ykm/Adobe-Express-file-1.png"
  alt="Flower Image"
  style="width: 75px; height: auto; position: absolute; top: 650px; left: 1150px;"
/>

<img
  src="https://i.ibb.co/84sq5Ykm/Adobe-Express-file-1.png"
  alt="Flower Image"
  style="width: 75px; height: auto; position: absolute; top: 275px; left: 1150px;"
/>

<img
  src="https://i.ibb.co/84sq5Ykm/Adobe-Express-file-1.png"
  alt="Flower Image"
  style="width: 100px; height: auto; position: absolute; top: 175px; left: 1200px; transform: rotate(15deg);"
/>

<img
  src="https://i.ibb.co/84sq5Ykm/Adobe-Express-file-1.png"
  alt="Flower Image"
  style="width: 150px; height: auto; position: absolute; top: 250px; left: 1250px;"
/>

<img
  src="https://i.ibb.co/nNKtLjTk/Adobe-Express-file-2.png"
  alt="Flower Image"
  style="width: 250px; height: auto; position: absolute; top: 350px; left: 1100px; transform: rotate(150deg)"
/>

<img
  src="https://i.ibb.co/nNKtLjTk/Adobe-Express-file-2.png"
  alt="Flower Image"
  style="width: 250px; height: auto; position: absolute; top: 125px; left: 975px; transform: rotate(270deg)"
/>

<img
  src="https://i.ibb.co/nNKtLjTk/Adobe-Express-file-2.png"
  alt="Flower Image"
  style="width: 250px; height: auto; position: absolute; top: 400px; left: 300px; transform: rotate(350deg)"
/>

<img
  src="https://i.ibb.co/nNKtLjTk/Adobe-Express-file-2.png"
  alt="Flower Image"
  style="width: 250px; height: auto; position: absolute; top: 600px; left: 550px; transform: rotate(60deg)"
/>

<!-- ============== CENTERED UI LAYER (strong inline centering) ============== -->
<div style="position:fixed; inset:0; display:grid; place-items:center; z-index:50;">
  <div style="display:flex; flex-direction:column; align-items:center; gap:12px;
            background:transparent; padding:0; border-radius:0; box-shadow:none;">
    <div style="display:flex; gap:12px; justify-content:center; width:100%; flex-wrap:wrap;">
      <select bind:value={selectedName} required disabled={loading} style="min-width:220px;">
        <option value="Select User">Select User</option>
        <option value="Dominic Veneziale">Dominic Veneziale</option>
        <option value="Julia Meaney">Julia Meaney</option>
        <option value="Vamu Srinivasan">Vamu Srinivasan</option>
        <option value="Vedu Srinivasan">Vedu Srinivasan</option>
        <option value="Varu Srinivasan">Varu Srinivasan</option>
        <option value="Matthew Aung">Matthew Aung</option>
        <option value="Gabe Magwood">Gabe Magwood</option>
        <option value="Kyler Mooney">Kyler Mooney</option>
        <option value="Maddie Oswald">Maddie Oswald</option>
        <option value="Cooper Morgan">Cooper Morgan</option>
        <option value="Joey Kohler">Joey Kohler</option>
        <option value="Mason Gildein">Mason Gildein</option>
        <option value="Krupa Dihora">Krupa Dihora</option>
        <option value="Yusef Seyed">Yusef Seyed</option>
        <option value="John Coult">John Coult</option>
        <option value="Mark Hernandez Guerra">Mark Hernandez Guerra</option>
        <option value="John Coult">John Coult</option>
        <option value="Dylan Braverman">Dylan Braverman</option>
        <option value="Jackson Burmeister">Jackson Burmeister</option>
        <option value="Karsten Immerzeal">Karsten Immerzeal</option>
        <option value="Stanley Wempe">Stanley Wempe</option>
        <option value="Victor Bodea">Victor Bodea</option>
        <option value="Alez Gualfieri">Alez Gualfieri</option>
        <option value="Ani Hari">Ani Hari</option>
        <option value="Aubrey Cressnan">Aubrey Cressnan</option>
        <option value="Ben Snyder">Ben Snyder</option>
        <option value="Conner Male">Conner Male</option>
        <option value="Daytona Christman">Daytona Christman</option>
        <option value="Daniel Kim">Daniel Kim</option>
        <option value="Emma Husvar">Emma Husvar</option>
        <option value="Geo Jung">Geo Jung</option>
        <option value="Grace Russell">Grace Russell</option>
        <option value="Grant Hufgard">Grant Hufgard</option>
        <option value="Isabella O.A.">Isabella O.A.</option>
        <option value="Jake Tsyvine">Jake Tsyvine</option>
        <option value="Jayee Lin">Jayee Lin</option>
        <option value="Joey Kholer">Joey Kholer</option>
        <option value="John Cult">John Cult</option>
        <option value="Karsten Immerzeel">Karsten Immerzeel</option>
        <option value="Manas Pol">Manas Pol</option>
        <option value="Matthew Ryan">Matthew Ryan</option>
        <option value="Myles Bartholomew">Myles Bartholomew</option>
        <option value="Paytuna A.">Paytuna A.</option>
        <option value="Quinn Ham">Quinn Ham</option>
        <option value="Ritwika Veeravalli">Ritwika Veeravalli</option>
        <option value="Sebastian Velez">Sebastian Velez</option>
        <option value="Trace Willaims">Trace Willaims</option>
        <option value="Vaaman Srinivasan">Vaaman Srinivasan</option>
        <option value="Vanessa Trbuza">Vanessa Trbuza</option>
        <option value="Varahan Srinivasan">Varahan Srinivasan</option>
        <option value="Vedanth Srinivasan">Vedanth Srinivasan</option>
        <option value="Yusef Syed">Yusef Syed</option>
        <option value="Akshaya Guduru">Akshaya Guduru</option>
        <option value="Anand Kunnath">Anand Kunnath</option>
      </select>

      <button
        type="button"
        class="btn py-2 px-4 text-sm"
        on:click={() => submitAttendance("Sign In")}
        disabled={loading}
      >
        {loading ? "Processing..." : "Sign In"}
      </button>

      <button
        type="button"
        class="btn py-2 px-4 text-sm"
        on:click={() => submitAttendance("Sign Out")}
        disabled={loading}
      >
        {loading ? "Processing..." : "Sign Out"}
      </button>
    </div>

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
      style="  background:#4169e1; cursor:crosshair; margin-top:6px;"
    ></canvas>

    <button type="button" class="btn" on:click={clearCanvas}>Clear</button>
  </div>
</div>

<style>
  /* keep only your canvas defaults (images are inline-styled already) */
  canvas {
    /* these are overridden by inline styles but left for clarity */
    border: 8px solid #ffffff;
    background-color: royalblue;
    cursor: crosshair;
    margin-top: 20px;
  }
</style>
