<script>
  let canvas;
  let ctx;
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  let attendanceData = [];
  let loading = false;
  let selectedName = "Select User";

  const submitAttendance = async (action) => {
    // Prevent "Select User" from being submitted
    if (selectedName === "Select User") {
      alert("Please select a user first.");
      return;
    }

    loading = true;
    try {
      const res = await fetch("http://localhost:5000/attendance", {
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
        // Refresh attendance table after update
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
      const res = await fetch("http://localhost:5000/attendance");
      const data = await res.json();
      attendanceData = data;
    } catch (err) {
      console.error("Failed to load attendance data:", err);
    }
  };

  // Load attendance data on component mount
  onMount(loadAttendance);



  // make the canvas
  const initCanvas = () => {
    ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#000";  // Black color
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 2;  // Stroke width
  };

  // Get mouse or touch position relative to the canvas
  const getPosition = (e) => {
    const rect = canvas.getBoundingClientRect();
    let x, y;

    // For touch events
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

  // Start drawing
  const startDrawing = (e) => {
    e.preventDefault();  // Prevent default behavior like scrolling on touch devices
    isDrawing = true;

    const { x, y } = getPosition(e);
    [lastX, lastY] = [x, y];
  };

  // Draw the line
  const draw = (e) => {
    if (!isDrawing) return;

    const { x, y } = getPosition(e);

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    [lastX, lastY] = [x, y];
  };

  // Stop drawing
  const stopDrawing = () => {
    isDrawing = false;
  };

  // Clear the canvas
  const clearCanvas = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  import { onMount } from "svelte";
  onMount(initCanvas);
</script>

<style>
  .center-wrapper {
    text-align: center;
  }

  canvas {
    border: 1px solid #ccc;
    cursor: crosshair;
    margin-top: 20px;
  }

  .form-container {
    display: inline-block;
    text-align: center;
  }

  select, button {
    margin: 10px;
  }
</style>

<div class="center-wrapper">
  <form method="POST" class="form-container">
    <br> <br> <br> <br>

    <!-- Name Dropdown -->
    <select 
      bind:value={selectedName} 
      class="select select-bordered w-full max-w-xs" 
      required
      disabled={loading}
    >
      <option value="Select User">Select User</option>
      <option value="Dominic Veneziale">Dominic Veneziale</option>
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
      <option value="Juia Meaney">Julia Meaney</option>
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
    </select>
    <br>

    <!-- sign in sign out buttons -->
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


    <br> <br> <br> <!-- spacing -->

    <!-- Canvas for Drawing -->
    <canvas
      bind:this={canvas}
      width="400"
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
    <br>
    <!-- Clear Button -->
    <button type="button" class="btn" on:click={clearCanvas}>Clear</button>
  </form>
</div>
