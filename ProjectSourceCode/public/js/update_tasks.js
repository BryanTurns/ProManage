const titleForUpdate = document.getElementById("update-status-title");
const complete = document.getElementById("complete");
const taskUpdateBox = document.getElementById("updated-task-status");
const targetTask = document.getElementById("taskname");

function testfunc(taskname, taskstatus, taskcomplete) {
  titleForUpdate.innerHTML = "Update Status: " + taskname;
  taskUpdateBox.value = taskstatus;
  targetTask.value = taskname;
  complete.checked = taskcomplete;
}
