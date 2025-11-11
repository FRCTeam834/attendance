<script>
  import { onMount } from 'svelte';
  import { getAttendance, createAttendance, health } from '../lib/api.js';

  let rows = [];
  let loading = false;
  let error = '';

  // Form fields
  let teamNumber = 834;
  let student = '';
  let status = 'present';

  async function load() {
    loading = true;
    error = '';
    try {
      // Optional health check to prove API is reachable
      await health();
      rows = await getAttendance(20);
    } catch (e) {
      error = e.message || String(e);
    } finally {
      loading = false;
    }
  }

  async function submit(e) {
    e.preventDefault();
    error = '';
    try {
      await createAttendance({
        teamNumber: Number(teamNumber),
        student: student.trim(),
        status,
        notedAt: new Date().toISOString()
      });
      await load(); // refresh list
      student = '';
      status = 'present';
    } catch (e) {
      error = e.message || String(e);
    }
  }

  onMount(load);
</script>

<style>
  .card { border: 1px solid var(--border, #ddd); border-radius: 12px; padding: 1rem; }
  .row { display: grid; grid-template-columns: 100px 1fr 120px 240px; gap: .5rem; }
  .muted { color: #666; font-size: .9rem; }
  .list { display: grid; gap: .5rem; margin-top: 1rem; }
  form { display: grid; gap: .5rem; margin-bottom: 1rem; }
  input, select, button { padding: .5rem .65rem; border-radius: 8px; border: 1px solid #ccc; }
  button { cursor: pointer; }
  .err { color: #b00020; white-space: pre-wrap; }
</style>

<div class="card">
  <h2>Attendance</h2>
  <p class="muted">Backed by <code>/api/attendance</code> (relative path, no localhost).</p>

  {#if error}
    <p class="err">⚠️ {error}</p>
  {/if}

  <form on:submit={submit}>
    <div class="row">
      <input type="number" bind:value={teamNumber} min="1" placeholder="Team #" />
      <input type="text" bind:value={student} placeholder="Student name" required />
      <select bind:value={status}>
        <option value="present">present</option>
        <option value="absent">absent</option>
        <option value="late">late</option>
      </select>
      <button type="submit">Add</button>
    </div>
  </form>

  <button on:click={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>

  <div class="list">
    <div class="row" style="font-weight:600">
      <div>Team</div><div>Student</div><div>Status</div><div>Noted At</div>
    </div>
    {#each rows as r}
      <div class="row">
        <div>{r.team_number ?? r.teamNumber}</div>
        <div>{r.student}</div>
        <div>{r.status}</div>
        <div>{new Date(r.noted_at ?? r.notedAt).toLocaleString()}</div>
      </div>
    {/each}
    {#if rows.length === 0}
      <p class="muted">No records yet.</p>
    {/if}
  </div>
</div>
