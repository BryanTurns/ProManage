var completedView = true;
const tasktable = document.getElementById("tasktable");
const pagetitle = document.getElementById("pagetitle");
const wholetable = document.getElementById("wholetable");
const viewbutton = document.getElementById("viewbutton");
// console.log(document.currentScript.getAttribute("tasks"));
// switchview(document.currentScript.getAttribute("tasks"));

function switchview(tasks) {
  console.log(tasks);
  completedView = !completedView;
  tasktable.innerText = "";
  if (completedView) {
    viewbutton.innerText = "View Incomplete Tasks";
    pagetitle.innerText = "Complete Tasks";
    wholetable.style.backgroundColor = "palegreen";
    for (var i = 0; i < tasks.length; i++) {
      if (!tasks[i].complete) continue;

      row = generateTaskRow(tasks[i]);

      tasktable.append(row);
    }
  } else {
    viewbutton.innerText = "View Complete Tasks";
    wholetable.style.backgroundColor = "lightpink";
    pagetitle.innerText = "Incomplete Tasks";
    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i].complete) continue;

      row = generateTaskRow(tasks[i]);

      tasktable.append(row);
    }
  }
}

function generateTaskRow(task) {
  console.log(task);
  const row = document.createElement("div");
  row.classList.add(["row"]);

  const taskname = document.createElement("div");
  taskname.classList.add(["col-sm"]);
  taskname.style.overflow = "auto";
  taskname.style.maxHeight = "100%";
  taskname.innerHTML = task.taskname;
  row.appendChild(taskname);

  const taskdescription = document.createElement("div");
  taskdescription.classList.add(["col-sm"]);
  taskdescription.style.overflow = "auto";
  taskdescription.style.maxHeight = "100%";
  taskdescription.innerHTML = task.taskdescription;
  row.appendChild(taskdescription);

  const taskstatus = document.createElement("div");
  taskstatus.classList.add(["col-sm"]);
  taskstatus.style.overflow = "auto";
  taskstatus.style.maxHeight = "100%";
  taskstatus.innerHTML = task.taskstatus;
  row.appendChild(taskstatus);

  const updatestatusdiv = document.createElement("div");
  updatestatusdiv.classList.add("col-2", "p-2");

  const updatestatusbutton = document.createElement("button");
  updatestatusbutton.type = "button";
  updatestatusbutton.classList.add("btn", "btn-primary");
  updatestatusbutton.setAttribute("data-toggle", "modal");
  updatestatusbutton.setAttribute("data-target", "#update-status");
  updatestatusbutton.innerHTML = "Update Status";
  updatestatusbutton.setAttribute(
    "onclick",
    `testfunc('${task.taskname}', '${task.taskstatus}', ${task.complete})`
  );

  updatestatusdiv.appendChild(updatestatusbutton);
  row.appendChild(updatestatusdiv);

  return row;
}
