/* VARIABLES */

// Variable to store the loaded json data
var data;

// Variable to keep reference for chart
var myChart;



/* ONCHANGE FUNCTIONS */

// Load json from file input, fill <select> inputs with available options and build table 
function loadFile() {
  var input = document.getElementById('fileInput');
  readFile(input.files[0], function(e) {
    data = JSON.parse(e.target.result);
    
    // Fill inputs for chart
    buildSelect(data, "System", "system");
    buildSelect(data, "Критичность", "critical");
    chart();

    // Fil inputs for table
    buildSelect(data, "System", "searchSystem");
    buildSelect(data, "Состояние", "searchState");
    buildSelect(data, "Найдено при", "foundFrom");
    buildSelect(data, "Критичность", "searchCritical");
    buildSelect(data, "Тип Дефекта", "defectType");
    buildSelect(data, "Метод обнаружения", "foundMethod");
    buildTable(data);
  });
}



/* ONCLICK FUNCTIONS */

// Gather information from selected input options and build chart according to it
function chart() {
  var startDate = dateFromInputId('startDate');
  var endDate   = dateFromInputId('endDate');

  var systemSelect   = document.getElementById("system").value;
  var criticalSelect = document.getElementById("critical").value;

  var bugs = data.filter(function(value, index, arr) {
    createDate = new Date(value["Дата создания"]);
    return matchDate(createDate, startDate, endDate) &&
           matchSelect(criticalSelect, value["Критичность"]) &&
           matchSelect(systemSelect, value["System"]);
  });

  var monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];

  var bugsCount = {};

  bugs.forEach(function(bug) {
    createDate = new Date(bug["Дата создания"]);
    month = monthNames[createDate.getMonth()];
    year  = createDate.getFullYear();
    key   = month + ' ' + year;
    if (bugsCount.hasOwnProperty(key)) {
      ++bugsCount[key];
    } else {
      bugsCount[key] = 1;
    }
  });

  var graphKeys = Object.keys(bugsCount);
  var graphValues = [];

  graphKeys.forEach(function(key) {
    graphValues.push(bugsCount[key]);
  });

  buildChart('Количество зарегистрированных багов', graphKeys, graphValues);
}

// Gather information from selected input and search data according to it
function search() {
  var id             = document.getElementById("ID").value;
  var searchSystem   = document.getElementById("searchSystem").value;
  var summary        = document.getElementById("summary").value;
  var searchState    = document.getElementById("searchState").value;
  var foundFrom      = document.getElementById("foundFrom").value;
  var searchCritical = document.getElementById("searchCritical").value;
  var foundMethod    = document.getElementById("foundMethod").value;
  var defectType     = document.getElementById("defectType").value;
  var reopensAmount  = document.getElementById("reopensAmount").value;

  var createStartDate = dateFromInputId('createStartDate');
  var createEndDate   = dateFromInputId('createEndDate');
  var changeStartDate = dateFromInputId('changeStartDate');
  var changeEndDate   = dateFromInputId('changeEndDate');
  var closeStartDate  = dateFromInputId('closeStartDate');
  var closeEndDate    = dateFromInputId('closeEndDate');

  var tbody = document.getElementById("searchBody");
  
  for (var i = 0, row; row = tbody.rows[i]; ++i) {
    var tID             = row.querySelector('[data-search="ID"]').innerHTML;
    var tSearchSystem   = row.querySelector('[data-search="System"]').innerHTML;
    var tSummary        = row.querySelector('[data-search="Summary"]').innerHTML;
    var tSearchState    = row.querySelector('[data-search="Состояние"]').innerHTML;
    var tFoundFrom      = row.querySelector('[data-search="Найдено при"]').innerHTML;
    var tSearchCritical = row.querySelector('[data-search="Критичность"]').innerHTML;
    var tFoundMethod    = row.querySelector('[data-search="Метод обнаружения"]').innerHTML;
    var tDefectType     = row.querySelector('[data-search="Тип Дефекта"]').innerHTML;
    var tReopensAmount  = row.querySelector('[data-search="reopens_amount"]').innerHTML;

    var tCreateDate = dateFromDomAttribute(row, '[data-search="Дата создания"]');
    var tChangeDate = dateFromDomAttribute(row, '[data-search="Дата изменения"]');
    var tCloseDate  = dateFromDomAttribute(row, '[data-search="Дата закрытия"]');

    if (matchDate(tCreateDate, createStartDate, createEndDate) &&
        matchDate(tChangeDate, changeStartDate, changeEndDate) &&
        matchDate(tCloseDate, closeStartDate, closeEndDate) &&
        matchNumber(id, tID) && matchNumber(reopensAmount, tReopensAmount) &&
        matchSelect(searchSystem, tSearchSystem) &&
        matchSelect(searchState, tSearchState) &&
        matchSelect(searchCritical, tSearchCritical) &&
        matchSelect(foundFrom, tFoundFrom) &&
        matchSelect(foundMethod, tFoundMethod) &&
        matchSelect(defectType, tDefectType) &&
        matchText(summary, tSummary)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  }
}



/* SERVICE FUNCTIONS */

// Build chart according to arguments
function buildChart(title, xData, yData) {
  var ctx = document.getElementById("myChart").getContext('2d');
  if (myChart != undefined) {
    myChart.destroy();
  }
  myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: xData,
      datasets: [{
        label: title,
        data: yData,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255,99,132,1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero:true
          }
        }]
      }
    }
  });
}

// Fill <select> input ('target') with options from json ('data') using given criteria ('source')
function buildSelect(data, source, target) {
  var options = getUniqueCriteria(data, source);
  var select = document.getElementById(target);
  select.options.length = 0;
  select.appendChild(document.createElement('option'));
  options.forEach(function(elem) {
    var option = document.createElement('option');
    option.value = elem;
    option.innerHTML = elem;
    select.appendChild(option);
  });
}

// Build table from given json ('data')
function buildTable(data) {
  var tbody = document.getElementById("searchBody");
  data.forEach(function(obj) {
    var trow = document.createElement('tr');
    Object.keys(obj).forEach(function(key) {
      var tdata = document.createElement('td');
      tdata.innerHTML = obj[key];
      tdata.setAttribute("data-search", key);
      trow.appendChild(tdata);
    });
    tbody.appendChild(trow);
  });
}

// Create new date from selected field by given attribute
function dateFromDomAttribute(dom, attribute) {
  elem = dom.querySelector(attribute).innerHTML;
  date = new Date(elem);
  if (isNaN(date.getTime())) {
    return null;
  } else {
    return date;
  }
}

// Create new date from selected field by given id
function dateFromInputId(id) {
  elem = document.getElementById(id).value;
  date = new Date(elem);
  if (isNaN(date.getTime())) {
    return null;
  } else {
    return date;
  }
}

// Get all unique values from json ('data') by given key ('key')
function getUniqueCriteria(data, key) {
  var result = data.map(function(obj) {
    return obj[key];
  }).filter(function(value, index, arr) {
    return arr.indexOf(value) === index;
  }).sort();
  return result;
}

// Check if date is in the given range
// If any of the range borders is not mentioned, return true for it
function matchDate(date, startDate, endDate) {
  result = true;
  if (startDate !== null) {
    result = (result && date >= startDate);
  }
  if (endDate !== null) {
    result = (result && date <= endDate);
  }
  return result;
}

// Check if selected number match its target (e.g. from search table)
// If source is not mentioned, return true
function matchNumber(source, target) {
  result = true;
  if (source !== null && source !== "") {
    result = (result && parseInt(source) == parseInt(target));
  }
  return result;
}

// Check if selected string match its target (e.g. from search table)
// If source is not mentioned, return true
function matchSelect(source, target) {
  result = true;
  if (source !== null && source !== "") {
    result = (result && source === target);
  }
  return result;
}

// Check if selected text match its target (e.g. from search table)
// 'source' works like a filter. If it's not mentioned, return true
function matchText(source, target) {
  result = true;
  if (source !== null && source !== "") {
    filter = source.toUpperCase();
    result = (result && target.toUpperCase().indexOf(filter) > -1);
  }
  return result;
}

// Read data from file input using FileReader API
function readFile(file, onLoadCallback) {
  var reader = new FileReader();
  reader.onload = onLoadCallback;
  reader.readAsText(file);
}
