const titleForUpdate = document.getElementById("update-status-title");
const complete = document.getElementById("complete");
const taskUpdateBox = document.getElementById("updated-task-status");
const targetTask = document.getElementById("taskname");
console.log(taskUpdateBox);

function testfunc(taskname, taskstatus, taskcomplete) {
  console.log(complete);
  console.log(taskcomplete);
  titleForUpdate.innerHTML = "Update Status: " + taskname;
  taskUpdateBox.value = taskstatus;
  targetTask.value = taskname;
  if (complete.checked == null) complete.checked = false;
  else complete.checked = taskcomplete;
}
