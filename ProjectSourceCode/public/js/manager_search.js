function updateResults(event, data) {
  const managerField = document.getElementById("manager");
  let currentText = managerField.value;
  data.sort((a, b) => {
    a - b;
  });
  console.log(data);
}
