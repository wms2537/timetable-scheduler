// Global state variables
let timetableData = null;
let currentView = 'room';
let currentEntity = '';

// State for fixed assignments
let fixedAssignments = [];

// Example data hardcoded
const exampleData = {
    "teachers": ["Smith", "Jones", "Wilson", "Brown", "Davis"],
    "subjects": ["Math", "Science", "English", "History", "PE"],
    "classes": ["10A", "10B", "11A", "11B", "12A"],
    "rooms": ["R101", "R102", "R103", "Lab1", "Gym"],
    "days": ["Mon", "Tue", "Wed", "Thu", "Fri"],
    "periods": ["P1", "P2", "P3", "P4", "P5", "P6"],
    
    "teacher_subjects": {
      "Smith": ["Math", "Science"],
      "Jones": ["English", "History"],
      "Wilson": ["Math", "PE"],
      "Brown": ["Science", "Math", "PE"],
      "Davis": ["History", "English"]
    },
    
    "teacher_classes": {
      "Smith": ["10A", "11A", "12A"],
      "Jones": ["10A", "10B", "11B"],
      "Wilson": ["10B", "11A", "12A"],
      "Brown": ["10A", "10B", "11B"],
      "Davis": ["11A", "11B", "12A"]
    },
    
    "class_subjects": {
      "10A": {"Math": 3, "Science": 3, "English": 3, "History": 2, "PE": 1},
      "10B": {"Math": 3, "Science": 3, "English": 3, "History": 2, "PE": 1},
      "11A": {"Math": 3, "Science": 3, "English": 3, "History": 2, "PE": 1},
      "11B": {"Math": 3, "Science": 3, "English": 3, "History": 2, "PE": 1},
      "12A": {"Math": 4, "Science": 4, "English": 3, "History": 2, "PE": 0}
    },
    
    "subject_constraints": {
      "Math": [0, 2],
      "Science": [0, 2],
      "English": [0, 2],
      "History": [0, 1],
      "PE": [0, 1]
    },
    
    "class_rankings": {
      "10A": 8,
      "10B": 4,
      "11A": 8,
      "11B": 4,
      "12A": 7
    },
    
    "room_suitability": {
      "Science": ["Lab1", "R101"],
      "PE": ["Gym"],
      "Math": ["R101", "R102", "R103"],
      "English": ["R101", "R102", "R103"],
      "History": ["R101", "R102", "R103"]
    },
    
    "fixed_assignments": [
      {"teacher": "Smith", "class": "12A", "subject": "Math"},
      {"teacher": "Davis", "class": "11A", "subject": "History"}
    ],
    
    "teacher_unavailability": {
      "Smith": [["Mon", "P1"], ["Fri", "P6"]],
      "Jones": [["Wed", "P3"], ["Wed", "P4"]]
    },
    
    "teacher_preferences": {
      "Wilson": [["Mon", "P1", 10], ["Mon", "P2", 8]],
      "Brown": [["Fri", "P5", 10], ["Fri", "P6", 10]]
    },
    
    "consecutive_periods": {
    },
    
    "break_periods": [
      ["Mon", "P3"],
      ["Tue", "P3"],
      ["Wed", "P3"],
      ["Thu", "P3"],
      ["Fri", "P3"]
    ]
};

// Initialize form when document loads
document.addEventListener('DOMContentLoaded', () => {
    // Set up event listeners
    document.getElementById('next-step1').addEventListener('click', () => {
        if (validateStep1()) {
            populateTeacherSubjects();
            populateTeacherClasses();
            showStep(2);
        }
    });
    
    document.getElementById('next-step2').addEventListener('click', () => {
        populateClassSubjects();
        populateSubjectConstraints();
        populateRoomSuitability();
        populateClassRankings();
        showStep(3);
    });
    
    document.getElementById('next-step3').addEventListener('click', () => {
        populateBreakPeriods();
        populateTeacherUnavailability();
        populateTeacherPreferences();
        populateConsecutivePeriods();
        populateFixedAssignments();
        showStep(4);
    });
    
    document.getElementById('generate-schedule').addEventListener('click', generateSchedule);
    document.getElementById('add-fixed-assignment').addEventListener('click', addFixedAssignment);
    
    // Add event listener for loading example data
    document.getElementById('load-example').addEventListener('click', loadExampleData);
    
    // Add event listener for JSON file upload
    document.getElementById('json-file-input').addEventListener('change', handleFileUpload);
});

// Navigation functions
function showStep(step) {
    // Hide all step contents
    document.querySelectorAll('[id^="step"]').forEach(el => {
        if (el.id.endsWith('-content')) {
            el.classList.add('hidden');
        } else {
            el.classList.remove('step-active');
        }
    });
    
    // Show selected step
    document.getElementById(`step${step}-content`).classList.remove('hidden');
    document.getElementById(`step${step}`).classList.add('step-active');
}

// Load example data from hardcoded example
function loadExampleData() {
    try {
        const data = exampleData;
        
        // Fill in basic data
        document.getElementById('teachers').value = data.teachers.join('\n');
        document.getElementById('subjects').value = data.subjects.join('\n');
        document.getElementById('classes').value = data.classes.join('\n');
        document.getElementById('rooms').value = data.rooms.join('\n');
        document.getElementById('days').value = data.days.join('\n');
        document.getElementById('periods').value = data.periods.join('\n');
        
        // Store fixed assignments for later use
        fixedAssignments = data.fixed_assignments || [];
        
        // Alert the user
        alert('Example data loaded successfully! Click Next to continue.');
    } catch (error) {
        console.error('Error loading example data:', error);
        alert('Failed to load example data. Please check the console for details.');
    }
}

// Handle JSON file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate the JSON structure
            if (!validateJsonStructure(data)) {
                alert('Invalid JSON structure. Please check the file format.');
                return;
            }
            
            // Fill in basic data
            document.getElementById('teachers').value = data.teachers.join('\n');
            document.getElementById('subjects').value = data.subjects.join('\n');
            document.getElementById('classes').value = data.classes.join('\n');
            document.getElementById('rooms').value = data.rooms.join('\n');
            document.getElementById('days').value = data.days.join('\n');
            document.getElementById('periods').value = data.periods.join('\n');
            
            // Store fixed assignments for later use
            fixedAssignments = data.fixed_assignments || [];
            
            // Alert the user
            alert('JSON data loaded successfully! Click Next to continue.');
            
            // Reset the file input
            document.getElementById('json-file-input').value = '';
        } catch (error) {
            console.error('Error parsing JSON file:', error);
            alert('Failed to parse JSON file. Please check the file format.');
        }
    };
    
    reader.onerror = function() {
        console.error('Error reading file');
        alert('Error reading file. Please try again.');
    };
    
    reader.readAsText(file);
}

// Validate JSON structure
function validateJsonStructure(data) {
    // Check required fields
    const requiredFields = ['teachers', 'subjects', 'classes', 'rooms', 'days', 'periods'];
    for (const field of requiredFields) {
        if (!data[field] || !Array.isArray(data[field]) || data[field].length === 0) {
            console.error(`Missing or invalid required field: ${field}`);
            return false;
        }
    }
    
    // Additional validations can be added here
    
    return true;
}

// Form validation functions
function validateStep1() {
    const requiredFields = ['teachers', 'subjects', 'classes', 'rooms', 'days', 'periods'];
    let isValid = true;
    
    for (const field of requiredFields) {
        const element = document.getElementById(field);
        if (!element.value.trim()) {
            element.classList.add('border-red-500');
            isValid = false;
        } else {
            element.classList.remove('border-red-500');
        }
    }
    
    if (!isValid) {
        alert('Please fill in all required fields');
    }
    
    return isValid;
}

// Helper function to get array from textarea
function getArrayFromTextarea(id) {
    return document.getElementById(id).value
        .split('\n')
        .map(item => item.trim())
        .filter(item => item);
}

// Dynamic form generation functions
function populateTeacherSubjects() {
    const container = document.getElementById('teacher-subjects-container');
    container.innerHTML = '';
    
    const teachers = getArrayFromTextarea('teachers');
    const subjects = getArrayFromTextarea('subjects');
    
    teachers.forEach(teacher => {
        const teacherDiv = document.createElement('div');
        teacherDiv.className = 'border rounded-lg p-4';
        teacherDiv.innerHTML = `
            <h4 class="font-medium mb-2">${teacher}</h4>
            <div class="grid grid-cols-2 gap-2">
                ${subjects.map(subject => `
                    <div>
                        <label class="inline-flex items-center">
                            <input type="checkbox" class="rounded text-primary" name="teacher-subject-${teacher}" value="${subject}">
                            <span class="ml-2">${subject}</span>
                        </label>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(teacherDiv);
    });
    
    // Check boxes based on loaded example data
    if (exampleData && exampleData.teacher_subjects) {
        for (const [teacher, subjects] of Object.entries(exampleData.teacher_subjects)) {
            subjects.forEach(subject => {
                const checkbox = document.querySelector(`input[name="teacher-subject-${teacher}"][value="${subject}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
    }
}

function populateTeacherClasses() {
    const container = document.getElementById('teacher-classes-container');
    container.innerHTML = '';
    
    const teachers = getArrayFromTextarea('teachers');
    const classes = getArrayFromTextarea('classes');
    
    teachers.forEach(teacher => {
        const teacherDiv = document.createElement('div');
        teacherDiv.className = 'border rounded-lg p-4';
        teacherDiv.innerHTML = `
            <h4 class="font-medium mb-2">${teacher}</h4>
            <div class="grid grid-cols-2 gap-2">
                ${classes.map(classId => `
                    <div>
                        <label class="inline-flex items-center">
                            <input type="checkbox" class="rounded text-primary" name="teacher-class-${teacher}" value="${classId}">
                            <span class="ml-2">${classId}</span>
                        </label>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(teacherDiv);
    });
    
    // Check boxes based on loaded example data
    if (exampleData && exampleData.teacher_classes) {
        for (const [teacher, classes] of Object.entries(exampleData.teacher_classes)) {
            classes.forEach(classId => {
                const checkbox = document.querySelector(`input[name="teacher-class-${teacher}"][value="${classId}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
    }
}

function populateClassSubjects() {
    const container = document.getElementById('class-subjects-container');
    container.innerHTML = '';
    
    const classes = getArrayFromTextarea('classes');
    const subjects = getArrayFromTextarea('subjects');
    
    // Create the table
    const table = document.createElement('table');
    table.className = 'min-w-full';
    
    // Create header row
    let headerRow = '<tr><th class="py-2 px-4 bg-gray-100 text-left">Class</th>';
    subjects.forEach(subject => {
        headerRow += `<th class="py-2 px-4 bg-gray-100 text-center">${subject}</th>`;
    });
    headerRow += '</tr>';
    
    // Create data rows
    let dataRows = '';
    classes.forEach(classId => {
        dataRows += `<tr><td class="py-2 px-4 border-b">${classId}</td>`;
        subjects.forEach(subject => {
            dataRows += `
                <td class="py-2 px-4 border-b text-center">
                    <input type="number" 
                           min="0" 
                           max="10" 
                           class="w-16 p-1 text-center border rounded" 
                           id="class-subject-${classId}-${subject}" 
                           value="0">
                </td>
            `;
        });
        dataRows += '</tr>';
    });
    
    table.innerHTML = `<thead>${headerRow}</thead><tbody>${dataRows}</tbody>`;
    container.appendChild(table);
    
    // Fill in values from example data
    if (exampleData && exampleData.class_subjects) {
        for (const [classId, subjects] of Object.entries(exampleData.class_subjects)) {
            for (const [subject, periods] of Object.entries(subjects)) {
                const input = document.getElementById(`class-subject-${classId}-${subject}`);
                if (input) input.value = periods;
            }
        }
    }
}

function populateSubjectConstraints() {
    const container = document.getElementById('subject-constraints-container');
    container.innerHTML = '';
    
    const subjects = getArrayFromTextarea('subjects');
    
    subjects.forEach(subject => {
        const subjectDiv = document.createElement('div');
        subjectDiv.className = 'border rounded-lg p-4';
        subjectDiv.innerHTML = `
            <h4 class="font-medium mb-2">${subject}</h4>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-gray-700 text-sm mb-1">Min Daily</label>
                    <input type="number" min="0" max="10" class="w-full p-2 border rounded" id="subject-min-${subject}" value="0">
                </div>
                <div>
                    <label class="block text-gray-700 text-sm mb-1">Max Daily</label>
                    <input type="number" min="0" max="10" class="w-full p-2 border rounded" id="subject-max-${subject}" value="2">
                </div>
            </div>
        `;
        container.appendChild(subjectDiv);
    });
    
    // Fill in values from example data
    if (exampleData && exampleData.subject_constraints) {
        for (const [subject, constraints] of Object.entries(exampleData.subject_constraints)) {
            const minInput = document.getElementById(`subject-min-${subject}`);
            const maxInput = document.getElementById(`subject-max-${subject}`);
            
            if (minInput && constraints.length > 0) minInput.value = constraints[0];
            if (maxInput && constraints.length > 1) maxInput.value = constraints[1];
        }
    }
}

function populateRoomSuitability() {
    const container = document.getElementById('room-suitability-container');
    container.innerHTML = '';
    
    const subjects = getArrayFromTextarea('subjects');
    const rooms = getArrayFromTextarea('rooms');
    
    subjects.forEach(subject => {
        const subjectDiv = document.createElement('div');
        subjectDiv.className = 'border rounded-lg p-4';
        subjectDiv.innerHTML = `
            <h4 class="font-medium mb-2">${subject}</h4>
            <div class="grid grid-cols-2 gap-2">
                ${rooms.map(room => `
                    <div>
                        <label class="inline-flex items-center">
                            <input type="checkbox" class="rounded text-primary" name="room-subject-${subject}" value="${room}" checked>
                            <span class="ml-2">${room}</span>
                        </label>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(subjectDiv);
    });
    
    // Uncheck all checkboxes first
    document.querySelectorAll('[name^="room-subject-"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Check boxes based on example data
    if (exampleData && exampleData.room_suitability) {
        for (const [subject, rooms] of Object.entries(exampleData.room_suitability)) {
            rooms.forEach(room => {
                const checkbox = document.querySelector(`input[name="room-subject-${subject}"][value="${room}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
    }
}

function populateClassRankings() {
    const container = document.getElementById('class-rankings-container');
    container.innerHTML = '';
    
    const classes = getArrayFromTextarea('classes');
    
    classes.forEach(classId => {
        const classDiv = document.createElement('div');
        classDiv.className = 'border rounded-lg p-4';
        classDiv.innerHTML = `
            <h4 class="font-medium mb-2">${classId}</h4>
            <div class="flex items-center">
                <input type="range" min="1" max="10" class="w-full" id="class-rank-${classId}" value="5">
                <span class="ml-2 w-8 text-center" id="class-rank-value-${classId}">5</span>
            </div>
        `;
        container.appendChild(classDiv);
        
        // Add event listener to update the displayed value
        document.getElementById(`class-rank-${classId}`).addEventListener('input', function() {
            document.getElementById(`class-rank-value-${classId}`).textContent = this.value;
        });
    });
    
    // Fill in values from example data
    if (exampleData && exampleData.class_rankings) {
        for (const [classId, ranking] of Object.entries(exampleData.class_rankings)) {
            const input = document.getElementById(`class-rank-${classId}`);
            const valueSpan = document.getElementById(`class-rank-value-${classId}`);
            
            if (input) {
                input.value = ranking;
                if (valueSpan) valueSpan.textContent = ranking;
            }
        }
    }
}

function populateBreakPeriods() {
    const container = document.getElementById('break-periods-container');
    container.innerHTML = '';
    
    const days = getArrayFromTextarea('days');
    const periods = getArrayFromTextarea('periods');
    
    // Create the table
    const table = document.createElement('table');
    table.className = 'min-w-full';
    
    // Create header row
    let headerRow = '<tr><th class="py-2 px-4 bg-gray-100 text-left">Day</th>';
    periods.forEach(period => {
        headerRow += `<th class="py-2 px-4 bg-gray-100 text-center">${period}</th>`;
    });
    headerRow += '</tr>';
    
    // Create data rows
    let dataRows = '';
    days.forEach(day => {
        dataRows += `<tr><td class="py-2 px-4 border-b">${day}</td>`;
        periods.forEach(period => {
            dataRows += `
                <td class="py-2 px-4 border-b text-center">
                    <input type="checkbox" class="rounded text-primary" name="break-period" data-day="${day}" data-period="${period}">
                </td>
            `;
        });
        dataRows += '</tr>';
    });
    
    table.innerHTML = `<thead>${headerRow}</thead><tbody>${dataRows}</tbody>`;
    container.appendChild(table);
    
    // Check boxes based on example data
    if (exampleData && exampleData.break_periods) {
        exampleData.break_periods.forEach(([day, period]) => {
            const checkbox = document.querySelector(`input[name="break-period"][data-day="${day}"][data-period="${period}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }
}

function populateTeacherUnavailability() {
    const selectElement = document.getElementById('unavailable-teacher-select');
    selectElement.innerHTML = '<option value="">Select a teacher</option>';
    
    const teachers = getArrayFromTextarea('teachers');
    teachers.forEach(teacher => {
        selectElement.innerHTML += `<option value="${teacher}">${teacher}</option>`;
    });
    
    // Add event listener to show grid when teacher is selected
    selectElement.addEventListener('change', function() {
        if (this.value) {
            generateUnavailabilityGrid(this.value);
        } else {
            document.getElementById('teacher-unavailability-grid').innerHTML = '';
        }
    });
}

function generateUnavailabilityGrid(teacher) {
    const container = document.getElementById('teacher-unavailability-grid');
    container.innerHTML = '';
    
    const days = getArrayFromTextarea('days');
    const periods = getArrayFromTextarea('periods');
    
    // Create the table
    const table = document.createElement('table');
    table.className = 'min-w-full';
    
    // Create header row
    let headerRow = '<tr><th class="py-2 px-4 bg-gray-100 text-left">Day</th>';
    periods.forEach(period => {
        headerRow += `<th class="py-2 px-4 bg-gray-100 text-center">${period}</th>`;
    });
    headerRow += '</tr>';
    
    // Create data rows
    let dataRows = '';
    days.forEach(day => {
        dataRows += `<tr><td class="py-2 px-4 border-b">${day}</td>`;
        periods.forEach(period => {
            dataRows += `
                <td class="py-2 px-4 border-b text-center">
                    <input type="checkbox" class="rounded text-primary" name="unavailable-${teacher}" data-day="${day}" data-period="${period}">
                </td>
            `;
        });
        dataRows += '</tr>';
    });
    
    table.innerHTML = `<thead>${headerRow}</thead><tbody>${dataRows}</tbody>`;
    container.appendChild(table);
    
    // Check boxes based on example data
    if (exampleData && exampleData.teacher_unavailability && exampleData.teacher_unavailability[teacher]) {
        exampleData.teacher_unavailability[teacher].forEach(([day, period]) => {
            const checkbox = document.querySelector(`input[name="unavailable-${teacher}"][data-day="${day}"][data-period="${period}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }
}

function populateTeacherPreferences() {
    const selectElement = document.getElementById('preference-teacher-select');
    selectElement.innerHTML = '<option value="">Select a teacher</option>';
    
    const teachers = getArrayFromTextarea('teachers');
    teachers.forEach(teacher => {
        selectElement.innerHTML += `<option value="${teacher}">${teacher}</option>`;
    });
    
    // Add event listener to show grid when teacher is selected
    selectElement.addEventListener('change', function() {
        if (this.value) {
            generatePreferenceGrid(this.value);
        } else {
            document.getElementById('teacher-preference-grid').innerHTML = '';
        }
    });
}

function generatePreferenceGrid(teacher) {
    const container = document.getElementById('teacher-preference-grid');
    container.innerHTML = '';
    
    const days = getArrayFromTextarea('days');
    const periods = getArrayFromTextarea('periods');
    
    // Create the table
    const table = document.createElement('table');
    table.className = 'min-w-full';
    
    // Create header row
    let headerRow = '<tr><th class="py-2 px-4 bg-gray-100 text-left">Day</th>';
    periods.forEach(period => {
        headerRow += `<th class="py-2 px-4 bg-gray-100 text-center">${period}</th>`;
    });
    headerRow += '</tr>';
    
    // Create data rows
    let dataRows = '';
    days.forEach(day => {
        dataRows += `<tr><td class="py-2 px-4 border-b">${day}</td>`;
        periods.forEach(period => {
            dataRows += `
                <td class="py-2 px-4 border-b text-center">
                    <input type="number" 
                           min="0" 
                           max="10" 
                           class="w-12 p-1 text-center border rounded" 
                           name="preference-${teacher}" 
                           data-day="${day}" 
                           data-period="${period}" 
                           value="0">
                </td>
            `;
        });
        dataRows += '</tr>';
    });
    
    table.innerHTML = `<thead>${headerRow}</thead><tbody>${dataRows}</tbody>`;
    container.appendChild(table);
    
    // Fill in values from example data
    if (exampleData && exampleData.teacher_preferences && exampleData.teacher_preferences[teacher]) {
        exampleData.teacher_preferences[teacher].forEach(([day, period, score]) => {
            const input = document.querySelector(`input[name="preference-${teacher}"][data-day="${day}"][data-period="${period}"]`);
            if (input) input.value = score;
        });
    }
}

function populateConsecutivePeriods() {
    const container = document.getElementById('consecutive-periods-container');
    container.innerHTML = '';
    
    const subjects = getArrayFromTextarea('subjects');
    
    subjects.forEach(subject => {
        const subjectDiv = document.createElement('div');
        subjectDiv.className = 'border rounded-lg p-4';
        subjectDiv.innerHTML = `
            <h4 class="font-medium mb-2">${subject}</h4>
            <div>
                <label class="block text-gray-700 text-sm mb-1">Min Consecutive Periods</label>
                <input type="number" min="1" max="5" class="w-full p-2 border rounded" id="consecutive-${subject}" value="1">
            </div>
        `;
        container.appendChild(subjectDiv);
    });
    
    // Fill in values from example data
    if (exampleData && exampleData.consecutive_periods) {
        for (const [subject, minConsecutive] of Object.entries(exampleData.consecutive_periods)) {
            const input = document.getElementById(`consecutive-${subject}`);
            if (input) input.value = minConsecutive;
        }
    }
}

function populateFixedAssignments() {
    // Populate select options
    const teacherSelect = document.getElementById('fixed-teacher');
    const classSelect = document.getElementById('fixed-class');
    const subjectSelect = document.getElementById('fixed-subject');
    
    teacherSelect.innerHTML = '<option value="">Select Teacher</option>';
    classSelect.innerHTML = '<option value="">Select Class</option>';
    subjectSelect.innerHTML = '<option value="">Select Subject</option>';
    
    const teachers = getArrayFromTextarea('teachers');
    const classes = getArrayFromTextarea('classes');
    const subjects = getArrayFromTextarea('subjects');
    
    teachers.forEach(teacher => {
        teacherSelect.innerHTML += `<option value="${teacher}">${teacher}</option>`;
    });
    
    classes.forEach(classId => {
        classSelect.innerHTML += `<option value="${classId}">${classId}</option>`;
    });
    
    subjects.forEach(subject => {
        subjectSelect.innerHTML += `<option value="${subject}">${subject}</option>`;
    });
    
    // Load fixed assignments from example data
    if (exampleData && exampleData.fixed_assignments) {
        fixedAssignments = [...exampleData.fixed_assignments];
    }
    
    // Update the list display
    updateFixedAssignmentsList();
}

function addFixedAssignment() {
    const teacher = document.getElementById('fixed-teacher').value;
    const classId = document.getElementById('fixed-class').value;
    const subject = document.getElementById('fixed-subject').value;
    
    if (teacher && classId && subject) {
        // Check if this assignment already exists
        const exists = fixedAssignments.some(a => 
            a.teacher === teacher && 
            a.class === classId && 
            a.subject === subject
        );
        
        if (!exists) {
            fixedAssignments.push({
                teacher: teacher,
                class: classId,
                subject: subject
            });
            updateFixedAssignmentsList();
        } else {
            alert('This assignment already exists');
        }
    }
}

function updateFixedAssignmentsList() {
    const container = document.getElementById('fixed-assignments-list');
    
    if (fixedAssignments.length === 0) {
        container.innerHTML = '<p class="text-gray-500 italic">No fixed assignments added yet</p>';
        return;
    }
    
    let html = '<ul class="space-y-2">';
    
    fixedAssignments.forEach((assignment, index) => {
        html += `
            <li class="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span>${assignment.teacher} - ${assignment.class} - ${assignment.subject}</span>
                <button 
                    class="text-red-500 hover:text-red-700" 
                    onclick="removeFixedAssignment(${index})"
                >
                    Remove
                </button>
            </li>
        `;
    });
    
    html += '</ul>';
    container.innerHTML = html;
}

function removeFixedAssignment(index) {
    fixedAssignments.splice(index, 1);
    updateFixedAssignmentsList();
}

// Data collection functions
function collectFormData() {
    const data = {
        teachers: getArrayFromTextarea('teachers'),
        subjects: getArrayFromTextarea('subjects'),
        classes: getArrayFromTextarea('classes'),
        rooms: getArrayFromTextarea('rooms'),
        days: getArrayFromTextarea('days'),
        periods: getArrayFromTextarea('periods'),
        teacher_subjects: {},
        teacher_classes: {},
        class_subjects: {},
        subject_constraints: {},
        class_rankings: {},
        room_suitability: {},
        teacher_unavailability: {},
        teacher_preferences: {},
        consecutive_periods: {},
        break_periods: [],
        fixed_assignments: fixedAssignments
    };
    
    // Collect teacher subjects
    data.teachers.forEach(teacher => {
        const subjectCheckboxes = document.querySelectorAll(`input[name="teacher-subject-${teacher}"]:checked`);
        data.teacher_subjects[teacher] = Array.from(subjectCheckboxes).map(cb => cb.value);
    });
    
    // Collect teacher classes
    data.teachers.forEach(teacher => {
        const classCheckboxes = document.querySelectorAll(`input[name="teacher-class-${teacher}"]:checked`);
        data.teacher_classes[teacher] = Array.from(classCheckboxes).map(cb => cb.value);
    });
    
    // Collect class subjects
    data.classes.forEach(classId => {
        data.class_subjects[classId] = {};
        data.subjects.forEach(subject => {
            const periods = parseInt(document.getElementById(`class-subject-${classId}-${subject}`).value) || 0;
            if (periods > 0) {
                data.class_subjects[classId][subject] = periods;
            }
        });
    });
    
    // Collect subject constraints
    data.subjects.forEach(subject => {
        const minDaily = parseInt(document.getElementById(`subject-min-${subject}`).value) || 0;
        const maxDaily = parseInt(document.getElementById(`subject-max-${subject}`).value) || 0;
        data.subject_constraints[subject] = [minDaily, maxDaily];
    });
    
    // Collect class rankings
    data.classes.forEach(classId => {
        data.class_rankings[classId] = parseInt(document.getElementById(`class-rank-${classId}`).value) || 5;
    });
    
    // Collect room suitability
    data.subjects.forEach(subject => {
        const roomCheckboxes = document.querySelectorAll(`input[name="room-subject-${subject}"]:checked`);
        data.room_suitability[subject] = Array.from(roomCheckboxes).map(cb => cb.value);
    });
    
    // Collect break periods
    data.days.forEach(day => {
        data.periods.forEach(period => {
            const breakCheckbox = document.querySelector(`input[name="break-period"][data-day="${day}"][data-period="${period}"]`);
            if (breakCheckbox && breakCheckbox.checked) {
                data.break_periods.push([day, period]);
            }
        });
    });
    
    // Collect teacher unavailability
    data.teachers.forEach(teacher => {
        const unavailableCheckboxes = document.querySelectorAll(`input[name="unavailable-${teacher}"]:checked`);
        if (unavailableCheckboxes.length > 0) {
            data.teacher_unavailability[teacher] = Array.from(unavailableCheckboxes).map(cb => {
                return [cb.dataset.day, cb.dataset.period];
            });
        }
    });
    
    // Collect teacher preferences
    data.teachers.forEach(teacher => {
        const preferenceInputs = document.querySelectorAll(`input[name="preference-${teacher}"]`);
        const preferences = [];
        
        preferenceInputs.forEach(input => {
            const value = parseInt(input.value) || 0;
            if (value > 0) {
                preferences.push([input.dataset.day, input.dataset.period, value]);
            }
        });
        
        if (preferences.length > 0) {
            data.teacher_preferences[teacher] = preferences;
        }
    });
    
    // Collect consecutive periods
    data.subjects.forEach(subject => {
        const consecutive = parseInt(document.getElementById(`consecutive-${subject}`).value) || 1;
        if (consecutive > 1) {
            data.consecutive_periods[subject] = consecutive;
        }
    });
    
    return data;
}

// API interaction
function generateSchedule() {
    // Show loading spinner
    document.getElementById('loading-spinner').classList.remove('hidden');
    document.getElementById('generate-schedule').disabled = true;
    
    // Collect all form data
    const data = collectFormData();
    
    // Call the API endpoint
    fetch('/api/schedule', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Failed to generate schedule');
            });
        }
        return response.json();
    })
    .then(result => {
        // Hide loading spinner
        document.getElementById('loading-spinner').classList.add('hidden');
        document.getElementById('generate-schedule').disabled = false;
        
        // Store the timetable data
        timetableData = result;
        
        // Show the results step
        showStep(5);
        
        // Initialize the timetable view
        currentView = 'room';
        if (timetableData.rooms && timetableData.rooms.length > 0) {
            currentEntity = timetableData.rooms[0];
        }
        
        // Populate the entity select
        const viewEntitySelect = document.getElementById('view-entity-select');
        viewEntitySelect.innerHTML = '';
        timetableData.rooms.forEach(room => {
            viewEntitySelect.innerHTML += `<option value="${room}">${room}</option>`;
        });
        
        // Add event listener to switch entity
        viewEntitySelect.addEventListener('change', function() {
            currentEntity = this.value;
            renderTimetable();
        });
        
        // Render the timetable
        renderTimetable();
    })
    .catch(error => {
        // Hide loading spinner
        document.getElementById('loading-spinner').classList.add('hidden');
        document.getElementById('generate-schedule').disabled = false;
        
        // Show error message
        alert(`Error: ${error.message}`);
        console.error('Error generating schedule:', error);
    });
}

// Display functions
function switchView(view) {
    currentView = view;
    
    // Update tab UI
    document.getElementById('view-room-btn').classList.remove('tab-active');
    document.getElementById('view-teacher-btn').classList.remove('tab-active');
    document.getElementById('view-class-btn').classList.remove('tab-active');
    document.getElementById(`view-${view}-btn`).classList.add('tab-active');
    
    // Update selector
    const selector = document.getElementById('view-entity-select');
    selector.innerHTML = '';
    
    let entities = [];
    switch (view) {
        case 'room':
            entities = timetableData.rooms;
            break;
        case 'teacher':
            entities = timetableData.teachers;
            break;
        case 'class':
            entities = timetableData.classes;
            break;
    }
    
    entities.forEach(entity => {
        const option = document.createElement('option');
        option.value = entity;
        option.textContent = entity;
        selector.appendChild(option);
    });
    
    // Set current entity to first one and render timetable
    if (entities.length > 0) {
        currentEntity = entities[0];
        selector.value = currentEntity;
        renderTimetable();
    }
    
    // Add change listener
    selector.onchange = function() {
        currentEntity = this.value;
        renderTimetable();
    };
}

function renderTimetable() {
    const container = document.getElementById('timetable-container');
    
    if (!timetableData || !currentEntity) {
        container.innerHTML = '<p class="text-red-500">No timetable data available</p>';
        return;
    }
    
    const days = timetableData.days;
    const periods = timetableData.periods;
    const breakPeriods = timetableData.break_periods;
    
    // Create timetable HTML
    let html = `
        <table class="min-w-full border-collapse">
            <thead>
                <tr>
                    <th class="py-3 px-4 bg-gray-100 text-left">Period</th>
                    ${days.map(day => `<th class="py-3 px-4 bg-gray-100 text-center">${day}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
    `;
    
    periods.forEach(period => {
        html += `<tr><td class="py-2 px-4 border font-medium">${period}</td>`;
        
        days.forEach(day => {
            const isBreak = breakPeriods.some(bp => bp[0] === day && bp[1] === period);
            const key = `${day}_${period}`;
            
            if (isBreak) {
                html += `<td class="timetable-cell border p-2 bg-gray-200 text-center">BREAK</td>`;
            } else {
                let assignment = null;
                
                // Find the appropriate assignment based on the current view and entity
                if (timetableData.solution[key]) {
                    switch (currentView) {
                        case 'room':
                            assignment = timetableData.solution[key].find(a => a.room === currentEntity);
                            break;
                        case 'teacher':
                            assignment = timetableData.solution[key].find(a => a.teacher === currentEntity);
                            break;
                        case 'class':
                            assignment = timetableData.solution[key].find(a => a.class === currentEntity);
                            break;
                    }
                }
                
                if (assignment) {
                    let details = '';
                    switch (currentView) {
                        case 'room':
                            details = `<div class="font-medium">${assignment.subject}</div>
                                      <div class="text-sm">Teacher: ${assignment.teacher}</div>
                                      <div class="text-sm">Class: ${assignment.class}</div>`;
                            break;
                        case 'teacher':
                            details = `<div class="font-medium">${assignment.subject}</div>
                                      <div class="text-sm">Class: ${assignment.class}</div>
                                      <div class="text-sm">Room: ${assignment.room}</div>`;
                            break;
                        case 'class':
                            details = `<div class="font-medium">${assignment.subject}</div>
                                      <div class="text-sm">Teacher: ${assignment.teacher}</div>
                                      <div class="text-sm">Room: ${assignment.room}</div>`;
                            break;
                    }
                    
                    html += `<td class="timetable-cell border p-2 bg-white">${details}</td>`;
                } else {
                    html += `<td class="timetable-cell border p-2 bg-white text-center text-gray-400">Free</td>`;
                }
            }
        });
        
        html += `</tr>`;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

function downloadTimetable() {
    if (!timetableData) {
        alert('No timetable data available');
        return;
    }
    
    // Create CSV for current view and entity
    let csv = `${currentView.toUpperCase()}: ${currentEntity}\n\n`;
    
    // Header row with days
    csv += `Period,${timetableData.days.join(',')}\n`;
    
    timetableData.periods.forEach(period => {
        csv += period;
        
        timetableData.days.forEach(day => {
            const isBreak = timetableData.break_periods.some(bp => bp[0] === day && bp[1] === period);
            const key = `${day}_${period}`;
            
            if (isBreak) {
                csv += ',BREAK';
            } else {
                let assignment = null;
                
                // Find the appropriate assignment based on the current view and entity
                if (timetableData.solution[key]) {
                    switch (currentView) {
                        case 'room':
                            assignment = timetableData.solution[key].find(a => a.room === currentEntity);
                            break;
                        case 'teacher':
                            assignment = timetableData.solution[key].find(a => a.teacher === currentEntity);
                            break;
                        case 'class':
                            assignment = timetableData.solution[key].find(a => a.class === currentEntity);
                            break;
                    }
                }
                
                if (assignment) {
                    let details = '';
                    switch (currentView) {
                        case 'room':
                            details = `${assignment.subject} (${assignment.teacher}, ${assignment.class})`;
                            break;
                        case 'teacher':
                            details = `${assignment.subject} (${assignment.class}, ${assignment.room})`;
                            break;
                        case 'class':
                            details = `${assignment.subject} (${assignment.teacher}, ${assignment.room})`;
                            break;
                    }
                    
                    csv += `,${details}`;
                } else {
                    csv += ',';
                }
            }
        });
        
        csv += '\n';
    });
    
    // Create download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `timetable_${currentView}_${currentEntity}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Sample data population for demo purposes
function populateSampleData() {
    document.getElementById('teachers').value = "Smith\nJones\nWilson\nBrown\nDavis";
    document.getElementById('subjects').value = "Math\nScience\nEnglish\nHistory\nPE";
    document.getElementById('classes').value = "10A\n10B\n11A\n11B\n12A";
    document.getElementById('rooms').value = "R101\nR102\nR103\nLab1\nGym";
    document.getElementById('days').value = "Mon\nTue\nWed\nThu\nFri";
    document.getElementById('periods').value = "P1\nP2\nP3\nP4\nP5\nP6";
} 