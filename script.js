// Global state variables
let timetableData = null;
let currentView = 'room';
let currentEntity = '';

// State for fixed assignments
let fixedAssignments = [];

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
    
    // Populate sample data for demo purposes
    populateSampleData();
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
        document.getElementById(`class-rank-${classId}`).addEventListener('input', (e) => {
            document.getElementById(`class-rank-value-${classId}`).textContent = e.target.value;
        });
    });
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
    let headerRow = '<tr><th class="py-2 px-4 bg-gray-100 text-left">Period</th>';
    days.forEach(day => {
        headerRow += `<th class="py-2 px-4 bg-gray-100 text-center">${day}</th>`;
    });
    headerRow += '</tr>';
    
    // Create data rows
    let dataRows = '';
    periods.forEach(period => {
        dataRows += `<tr><td class="py-2 px-4 border-b">${period}</td>`;
        days.forEach(day => {
            dataRows += `
                <td class="py-2 px-4 border-b text-center">
                    <input type="checkbox" 
                           class="rounded text-primary" 
                           id="break-${day}-${period}">
                </td>
            `;
        });
        dataRows += '</tr>';
    });
    
    table.innerHTML = `<thead>${headerRow}</thead><tbody>${dataRows}</tbody>`;
    container.appendChild(table);
}

function populateTeacherUnavailability() {
    const teacherSelect = document.getElementById('unavailable-teacher-select');
    teacherSelect.innerHTML = '';
    
    const teachers = getArrayFromTextarea('teachers');
    
    teachers.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher;
        option.textContent = teacher;
        teacherSelect.appendChild(option);
    });
    
    // Generate unavailability grid for first teacher
    if (teachers.length > 0) {
        generateUnavailabilityGrid(teachers[0]);
    }
    
    // Add event listener to switch teacher
    teacherSelect.addEventListener('change', (e) => {
        generateUnavailabilityGrid(e.target.value);
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
    let headerRow = '<tr><th class="py-2 px-4 bg-gray-100 text-left">Period</th>';
    days.forEach(day => {
        headerRow += `<th class="py-2 px-4 bg-gray-100 text-center">${day}</th>`;
    });
    headerRow += '</tr>';
    
    // Create data rows
    let dataRows = '';
    periods.forEach(period => {
        dataRows += `<tr><td class="py-2 px-4 border-b">${period}</td>`;
        days.forEach(day => {
            dataRows += `
                <td class="py-2 px-4 border-b text-center">
                    <input type="checkbox" 
                           class="rounded text-primary" 
                           id="unavailable-${teacher}-${day}-${period}"
                           data-day="${day}"
                           data-period="${period}"
                           data-teacher="${teacher}">
                </td>
            `;
        });
        dataRows += '</tr>';
    });
    
    table.innerHTML = `<thead>${headerRow}</thead><tbody>${dataRows}</tbody>`;
    container.appendChild(table);
}

function populateTeacherPreferences() {
    const teacherSelect = document.getElementById('preference-teacher-select');
    teacherSelect.innerHTML = '';
    
    const teachers = getArrayFromTextarea('teachers');
    
    teachers.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher;
        option.textContent = teacher;
        teacherSelect.appendChild(option);
    });
    
    // Generate preference grid for first teacher
    if (teachers.length > 0) {
        generatePreferenceGrid(teachers[0]);
    }
    
    // Add event listener to switch teacher
    teacherSelect.addEventListener('change', (e) => {
        generatePreferenceGrid(e.target.value);
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
    let headerRow = '<tr><th class="py-2 px-4 bg-gray-100 text-left">Period</th>';
    days.forEach(day => {
        headerRow += `<th class="py-2 px-4 bg-gray-100 text-center">${day}</th>`;
    });
    headerRow += '</tr>';
    
    // Create data rows
    let dataRows = '';
    periods.forEach(period => {
        dataRows += `<tr><td class="py-2 px-4 border-b">${period}</td>`;
        days.forEach(day => {
            dataRows += `
                <td class="py-2 px-4 border-b text-center">
                    <input type="number" 
                           min="0" 
                           max="10" 
                           class="w-12 p-1 text-center border rounded" 
                           id="preference-${teacher}-${day}-${period}"
                           data-day="${day}"
                           data-period="${period}"
                           data-teacher="${teacher}"
                           value="0">
                </td>
            `;
        });
        dataRows += '</tr>';
    });
    
    table.innerHTML = `<thead>${headerRow}</thead><tbody>${dataRows}</tbody>`;
    container.appendChild(table);
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
                <label class="block text-gray-700 text-sm mb-1">Consecutive Periods Required</label>
                <input type="number" min="1" max="5" class="w-full p-2 border rounded" id="consecutive-${subject}" value="1">
            </div>
        `;
        container.appendChild(subjectDiv);
    });
}

function populateFixedAssignments() {
    // Reset fixed assignments
    fixedAssignments = [];
    updateFixedAssignmentsList();
    
    // Populate dropdowns
    const teacherSelect = document.getElementById('fixed-teacher');
    const classSelect = document.getElementById('fixed-class');
    const subjectSelect = document.getElementById('fixed-subject');
    
    teacherSelect.innerHTML = '';
    classSelect.innerHTML = '';
    subjectSelect.innerHTML = '';
    
    const teachers = getArrayFromTextarea('teachers');
    const classes = getArrayFromTextarea('classes');
    const subjects = getArrayFromTextarea('subjects');
    
    teachers.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher;
        option.textContent = teacher;
        teacherSelect.appendChild(option);
    });
    
    classes.forEach(classId => {
        const option = document.createElement('option');
        option.value = classId;
        option.textContent = classId;
        classSelect.appendChild(option);
    });
    
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        subjectSelect.appendChild(option);
    });
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
            const isBreak = document.getElementById(`break-${day}-${period}`).checked;
            if (isBreak) {
                data.break_periods.push([day, period]);
            }
        });
    });
    
    // Collect teacher unavailability
    data.teachers.forEach(teacher => {
        const unavailableCheckboxes = document.querySelectorAll(`input[id^="unavailable-${teacher}-"]:checked`);
        if (unavailableCheckboxes.length > 0) {
            data.teacher_unavailability[teacher] = Array.from(unavailableCheckboxes).map(cb => {
                return [cb.dataset.day, cb.dataset.period];
            });
        }
    });
    
    // Collect teacher preferences
    data.teachers.forEach(teacher => {
        const preferenceInputs = document.querySelectorAll(`input[id^="preference-${teacher}-"]`);
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
    
    // Collect form data
    const data = collectFormData();
    
    // Make API call to BytePlus cloud function
    // In a real implementation, replace with your actual API endpoint
    const apiUrl = 'https://your-byteplus-function-url.example.com';
    
    // Simulate API call with setTimeout (replace with actual fetch in production)
    setTimeout(() => {
        // This is a simulated response
        const simulatedResponse = {
            solution: simulateSolution(data),
            teachers: data.teachers,
            subjects: data.subjects,
            classes: data.classes,
            rooms: data.rooms,
            days: data.days,
            periods: data.periods,
            break_periods: data.break_periods
        };
        
        // Hide loading spinner
        document.getElementById('loading-spinner').classList.add('hidden');
        
        // Process and display results
        timetableData = simulatedResponse;
        showStep(5);
        switchView('room');
    }, 2000);
    
    /* 
    // Real implementation would use fetch:
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        // Hide loading spinner
        document.getElementById('loading-spinner').classList.add('hidden');
        
        if (data.error) {
            alert('Error generating schedule: ' + data.error);
            return;
        }
        
        // Process and display results
        timetableData = data;
        showStep(5);
        switchView('room');
    })
    .catch(error => {
        // Hide loading spinner
        document.getElementById('loading-spinner').classList.add('hidden');
        alert('Error connecting to scheduler service: ' + error.message);
    });
    */
}

// This function creates a simulated solution for development/testing
function simulateSolution(data) {
    const solution = {};
    
    data.days.forEach(day => {
        data.periods.forEach(period => {
            const key = `${day}_${period}`;
            
            // Skip break periods
            if (data.break_periods.some(bp => bp[0] === day && bp[1] === period)) {
                solution[key] = [];
                return;
            }
            
            solution[key] = [];
            
            // Try to assign each class to a different room and teacher
            data.classes.forEach(classId => {
                // Find subjects this class needs
                const classSubjects = Object.keys(data.class_subjects[classId] || {});
                if (classSubjects.length === 0) return;
                
                // Pick a random subject
                const subject = classSubjects[Math.floor(Math.random() * classSubjects.length)];
                
                // Find teachers who can teach this subject to this class
                const availableTeachers = data.teachers.filter(teacher => {
                    return (data.teacher_subjects[teacher] || []).includes(subject) &&
                           (data.teacher_classes[teacher] || []).includes(classId) &&
                           !solution[key].some(a => a.teacher === teacher);
                });
                
                if (availableTeachers.length === 0) return;
                
                // Pick a random teacher
                const teacher = availableTeachers[Math.floor(Math.random() * availableTeachers.length)];
                
                // Find suitable rooms
                const suitableRooms = (data.room_suitability[subject] || data.rooms).filter(room => 
                    !solution[key].some(a => a.room === room)
                );
                
                if (suitableRooms.length === 0) return;
                
                // Pick a random room
                const room = suitableRooms[Math.floor(Math.random() * suitableRooms.length)];
                
                // Add assignment
                solution[key].push({
                    teacher: teacher,
                    class: classId,
                    subject: subject,
                    room: room
                });
            });
        });
    });
    
    return solution;
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