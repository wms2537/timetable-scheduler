from ortools.sat.python import cp_model
from collections import defaultdict
import json

class SchoolScheduler:
    def __init__(self, teachers, subjects, classes, rooms, days, periods):
        self.teachers = teachers
        self.subjects = subjects
        self.classes = classes
        self.rooms = rooms
        self.days = days
        self.periods = periods
        self.timeslots = [(day, period) for day in days for period in periods]
        
        # Settings to be populated
        self.teacher_subjects = {}  # {teacher_id: [subject_ids]}
        self.teacher_classes = {}   # {teacher_id: [class_ids]}
        self.class_subjects = {}    # {class_id: {subject_id: weekly_periods}}
        self.subject_constraints = {}  # {subject_id: (min_daily, max_daily)}
        self.class_rankings = {}    # {class_id: ranking}  # higher is better
        self.fixed_assignments = [] # [(teacher_id, class_id, subject_id)]
        self.room_suitability = {}  # {subject_id: [suitable_room_ids]}
        
        # New constraint settings
        self.teacher_unavailability = {}  # {teacher_id: [(day, period)]}
        self.teacher_preferences = {}     # {teacher_id: {(day, period): preference_score}}
        self.consecutive_periods = {}     # {subject_id: min_consecutive_periods}
        self.break_periods = []           # [(day, period)]
        
        # Model setup
        self.model = cp_model.CpModel()
        self.objective_terms = []
        self.schedule_vars = {}
        self.solution = None
    
    def set_teacher_subjects(self, teacher_subjects):
        self.teacher_subjects = teacher_subjects
    
    def set_teacher_classes(self, teacher_classes):
        self.teacher_classes = teacher_classes
    
    def set_class_subjects(self, class_subjects):
        self.class_subjects = class_subjects
    
    def set_subject_constraints(self, subject_constraints):
        self.subject_constraints = subject_constraints
    
    def set_class_rankings(self, class_rankings):
        self.class_rankings = class_rankings
    
    def add_fixed_assignment(self, teacher_id, class_id, subject_id):
        self.fixed_assignments.append((teacher_id, class_id, subject_id))
    
    def set_room_suitability(self, room_suitability):
        self.room_suitability = room_suitability
    
    # New methods for additional features
    def set_teacher_unavailability(self, teacher_unavailability):
        """Set when teachers are unavailable to teach."""
        self.teacher_unavailability = teacher_unavailability
    
    def set_teacher_preferences(self, teacher_preferences):
        """Set teacher preferences for specific timeslots (higher score = more preferred)."""
        self.teacher_preferences = teacher_preferences
    
    def set_consecutive_periods(self, consecutive_periods):
        """Set which subjects require consecutive periods and how many."""
        self.consecutive_periods = consecutive_periods
    
    def set_break_periods(self, break_periods):
        """Set which periods are designated as break/lunch periods."""
        self.break_periods = break_periods
    
    def create_variables(self):
        """Creates the boolean variables for the model."""
        for teacher in self.teachers:
            teacher_subjects = self.teacher_subjects.get(teacher, [])
            teacher_classes = self.teacher_classes.get(teacher, [])
            
            for class_id in teacher_classes:
                for subject in teacher_subjects:
                    if subject in self.class_subjects.get(class_id, {}):
                        suitable_rooms = self.room_suitability.get(subject, self.rooms)
                        for day, period in self.timeslots:
                            # Skip if this is a break period
                            if (day, period) in self.break_periods:
                                continue
                            
                            # Skip if teacher is unavailable at this time
                            if teacher in self.teacher_unavailability and (day, period) in self.teacher_unavailability.get(teacher, []):
                                continue
                                
                            for room in suitable_rooms:
                                self.schedule_vars[(teacher, class_id, subject, day, period, room)] = self.model.NewBoolVar(
                                    f"schedule_{teacher}_{class_id}_{subject}_{day}_{period}_{room}"
                                )
    
    def apply_constraints(self):
        # 1. Each teacher can only teach one class at a time
        for teacher in self.teachers:
            for day, period in self.timeslots:
                # Skip break periods
                if (day, period) in self.break_periods:
                    continue
                    
                teacher_slots = []
                for class_id in self.teacher_classes.get(teacher, []):
                    for subject in self.teacher_subjects.get(teacher, []):
                        for room in self.room_suitability.get(subject, self.rooms):
                            if (teacher, class_id, subject, day, period, room) in self.schedule_vars:
                                teacher_slots.append(self.schedule_vars[(teacher, class_id, subject, day, period, room)])
                
                if teacher_slots:
                    self.model.Add(sum(teacher_slots) <= 1)
        
        # 2. Each class can only have one subject at a time
        for class_id in self.classes:
            for day, period in self.timeslots:
                # Skip break periods
                if (day, period) in self.break_periods:
                    continue
                    
                class_slots = []
                for teacher in self.teachers:
                    for subject in self.teacher_subjects.get(teacher, []):
                        for room in self.room_suitability.get(subject, self.rooms):
                            if (teacher, class_id, subject, day, period, room) in self.schedule_vars:
                                class_slots.append(self.schedule_vars[(teacher, class_id, subject, day, period, room)])
                
                if class_slots:
                    self.model.Add(sum(class_slots) <= 1)
        
        # 3. Each room can only host one class at a time
        for room in self.rooms:
            for day, period in self.timeslots:
                # Skip break periods
                if (day, period) in self.break_periods:
                    continue
                    
                room_slots = []
                for teacher in self.teachers:
                    for class_id in self.classes:
                        for subject in self.teacher_subjects.get(teacher, []):
                            if room in self.room_suitability.get(subject, self.rooms):
                                if (teacher, class_id, subject, day, period, room) in self.schedule_vars:
                                    room_slots.append(self.schedule_vars[(teacher, class_id, subject, day, period, room)])
                
                if room_slots:
                    self.model.Add(sum(room_slots) <= 1)
        
        # 4. Each class must receive its required lessons for each subject
        for class_id in self.classes:
            for subject, weekly_periods in self.class_subjects.get(class_id, {}).items():
                subject_slots = []
                for teacher in self.teachers:
                    if class_id in self.teacher_classes.get(teacher, []) and subject in self.teacher_subjects.get(teacher, []):
                        for day, period in self.timeslots:
                            # Skip break periods
                            if (day, period) in self.break_periods:
                                continue
                                
                            for room in self.room_suitability.get(subject, self.rooms):
                                if (teacher, class_id, subject, day, period, room) in self.schedule_vars:
                                    subject_slots.append(self.schedule_vars[(teacher, class_id, subject, day, period, room)])
                
                if subject_slots:
                    self.model.Add(sum(subject_slots) == weekly_periods)
        
        # 5. Min/max daily periods per subject for each class
        for class_id in self.classes:
            for subject, (min_daily, max_daily) in self.subject_constraints.items():
                if subject in self.class_subjects.get(class_id, {}):
                    for day in self.days:
                        day_slots = []
                        for teacher in self.teachers:
                            if class_id in self.teacher_classes.get(teacher, []) and subject in self.teacher_subjects.get(teacher, []):
                                for period in self.periods:
                                    # Skip break periods
                                    if (day, period) in self.break_periods:
                                        continue
                                        
                                    for room in self.room_suitability.get(subject, self.rooms):
                                        if (teacher, class_id, subject, day, period, room) in self.schedule_vars:
                                            day_slots.append(self.schedule_vars[(teacher, class_id, subject, day, period, room)])
                        
                        if day_slots:
                            if min_daily > 0:
                                self.model.Add(sum(day_slots) >= min_daily)
                            self.model.Add(sum(day_slots) <= max_daily)
        
        # 6. Apply fixed assignments
        for teacher, class_id, subject in self.fixed_assignments:
            if subject in self.class_subjects.get(class_id, {}) and teacher in self.teachers:
                weekly_periods = self.class_subjects[class_id][subject]
                assignment_slots = []
                for day, period in self.timeslots:
                    # Skip break periods
                    if (day, period) in self.break_periods:
                        continue
                        
                    for room in self.room_suitability.get(subject, self.rooms):
                        if (teacher, class_id, subject, day, period, room) in self.schedule_vars:
                            assignment_slots.append(self.schedule_vars[(teacher, class_id, subject, day, period, room)])
                
                if assignment_slots:
                    self.model.Add(sum(assignment_slots) == weekly_periods)
        
        # 7. Consecutive periods for certain subjects
        for subject, min_consecutive in self.consecutive_periods.items():
            if min_consecutive <= 1:
                continue  # No need for special constraints
                
            for class_id in self.classes:
                if subject not in self.class_subjects.get(class_id, {}):
                    continue
                    
                for day in self.days:
                    valid_periods = [p for p in self.periods if (day, p) not in self.break_periods]
                    valid_periods.sort()  # Ensure periods are in order
                    
                    # For each possible starting period for a consecutive block
                    for start_idx in range(len(valid_periods) - min_consecutive + 1):
                        consecutive_block = valid_periods[start_idx:start_idx + min_consecutive]
                        
                        # For all teachers who can teach this subject to this class
                        for teacher in self.teachers:
                            if class_id not in self.teacher_classes.get(teacher, []):
                                continue
                            if subject not in self.teacher_subjects.get(teacher, []):
                                continue
                                
                            # Create variables to track if a block starts at this period
                            block_start_var = self.model.NewBoolVar(f"block_start_{teacher}_{class_id}_{subject}_{day}_{consecutive_block[0]}")
                            
                            # Calculate the variables for all periods in this potential block
                            block_period_vars = []
                            for period in consecutive_block:
                                period_vars = []
                                for room in self.room_suitability.get(subject, self.rooms):
                                    if (teacher, class_id, subject, day, period, room) in self.schedule_vars:
                                        period_vars.append(self.schedule_vars[(teacher, class_id, subject, day, period, room)])
                                
                                # If there are no variables for this period, we can't form a block here
                                if not period_vars:
                                    block_period_vars = []
                                    break
                                    
                                # We sum here because we might have multiple rooms, but at most one will be chosen
                                period_var_sum = sum(period_vars)
                                block_period_vars.append(period_var_sum)
                            
                            # If we can form a block, add the constraint
                            if block_period_vars:
                                # If block_start_var is true, all periods in the block must be scheduled
                                for period_var in block_period_vars:
                                    self.model.Add(period_var >= block_start_var)
                                    
                                # Ensure minimum consecutive periods
                                self.model.Add(sum(block_period_vars) >= min_consecutive * block_start_var)
        
        # 8. Balance teacher workload across good and poor classes (soft constraint)
        for teacher in self.teachers:
            teacher_classes = self.teacher_classes.get(teacher, [])
            if len(teacher_classes) > 1 and teacher_classes:
                avg_ranking = sum(self.class_rankings.get(c, 5) for c in teacher_classes) / len(teacher_classes)
                
                for class_id in teacher_classes:
                    class_rank = self.class_rankings.get(class_id, 5)
                    deviation = abs(class_rank - avg_ranking)
                    
                    for subject in self.teacher_subjects.get(teacher, []):
                        if subject in self.class_subjects.get(class_id, {}):
                            for day, period in self.timeslots:
                                # Skip break periods
                                if (day, period) in self.break_periods:
                                    continue
                                    
                                for room in self.room_suitability.get(subject, self.rooms):
                                    if (teacher, class_id, subject, day, period, room) in self.schedule_vars:
                                        penalty = int(deviation * 5)
                                        self.objective_terms.append(
                                            self.schedule_vars[(teacher, class_id, subject, day, period, room)] * penalty
                                        )
        
        # 9. Teacher preferences for timeslots (soft constraint)
        for teacher, preferences in self.teacher_preferences.items():
            for timeslot, preference_score in preferences.items():
                day, period = timeslot
                
                # Skip break periods
                if (day, period) in self.break_periods:
                    continue
                    
                # Apply preference as a reward (negative penalty)
                for class_id in self.teacher_classes.get(teacher, []):
                    for subject in self.teacher_subjects.get(teacher, []):
                        for room in self.room_suitability.get(subject, self.rooms):
                            if (teacher, class_id, subject, day, period, room) in self.schedule_vars:
                                # Preference score is a reward, so we negate it for the minimization objective
                                self.objective_terms.append(
                                    self.schedule_vars[(teacher, class_id, subject, day, period, room)] * -preference_score
                                )
    
    def _set_objective(self):
        """Set the objective function for the model."""
        if self.objective_terms:
            self.model.Minimize(sum(self.objective_terms))
    
    def solve(self):
        """Solve the model and return the schedule."""
        print("Creating variables...")
        self.create_variables()
        
        print("Applying constraints...")
        self.apply_constraints()
        
        print("Setting objective...")
        self._set_objective()
        
        print("Solving...")
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 60.0
        status = solver.Solve(self.model)
        
        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            print(f"Solution found! (status: {'OPTIMAL' if status == cp_model.OPTIMAL else 'FEASIBLE'})")
            
            # Create solution dictionary
            solution = defaultdict(list)
            for var_key, var in self.schedule_vars.items():
                if solver.Value(var) == 1:
                    teacher, class_id, subject, day, period, room = var_key
                    solution[(day, period)].append({
                        "teacher": teacher,
                        "class": class_id,
                        "subject": subject,
                        "room": room
                    })
            
            # Validate the solution to ensure all hard constraints are met
            validation_result = self.validate_solution(solution)
            if validation_result["is_valid"]:
                self.solution = solution
                return solution
            else:
                print(f"Invalid solution: {validation_result['reason']}")
                self.solution = None
                return None
        else:
            print(f"No solution found. Status: {status}")
            self.solution = None
            return None
    
    def validate_solution(self, solution):
        """Validate that all hard constraints are met in the solution."""
        # Check if all classes get their required subjects
        for class_id in self.classes:
            for subject, required_periods in self.class_subjects.get(class_id, {}).items():
                actual_periods = 0
                for (day, period), assignments in solution.items():
                    for assignment in assignments:
                        if assignment["class"] == class_id and assignment["subject"] == subject:
                            actual_periods += 1
                
                if actual_periods < required_periods:
                    return {
                        "is_valid": False,
                        "reason": f"Class {class_id} requires {required_periods} periods of {subject}, but only got {actual_periods}",
                        "constraint_type": "class_subject_requirement"
                    }
        
        # Check for consecutive periods for subjects that require them
        for subject, min_consecutive in self.consecutive_periods.items():
            if min_consecutive <= 1:
                continue
                
            for class_id in self.classes:
                if subject not in self.class_subjects.get(class_id, {}):
                    continue
                    
                has_consecutive = False
                for day in self.days:
                    # Get all periods for this subject, class, and day
                    day_periods = []
                    for period in self.periods:
                        if (day, period) in solution:
                            for assignment in solution[(day, period)]:
                                if assignment["class"] == class_id and assignment["subject"] == subject:
                                    day_periods.append(period)
                
                    # Sort periods and check for consecutive sequences
                    day_periods.sort()
                    max_consecutive = 0
                    current_consecutive = 1
                    for i in range(1, len(day_periods)):
                        # Get numeric indices of periods to check if they're consecutive
                        curr_idx = self.periods.index(day_periods[i])
                        prev_idx = self.periods.index(day_periods[i-1])
                        
                        if curr_idx == prev_idx + 1:
                            current_consecutive += 1
                        else:
                            current_consecutive = 1
                        
                        max_consecutive = max(max_consecutive, current_consecutive)
                    
                    if max_consecutive >= min_consecutive:
                        has_consecutive = True
                        break
                
                if not has_consecutive and self.class_subjects[class_id].get(subject, 0) > 0:
                    return {
                        "is_valid": False,
                        "reason": f"Subject {subject} requires at least {min_consecutive} consecutive periods for class {class_id}, but none were scheduled",
                        "constraint_type": "consecutive_periods"
                    }
        
        # If we got here, all hard constraints are satisfied
        return {"is_valid": True}
    
    def get_solution_json(self):
        """Returns the solution in a JSON-serializable format."""
        if not self.solution:
            return {"error": "No solution available"}
            
        # Convert defaultdict to regular dict and tuples to lists for JSON serialization
        solution_dict = {}
        for (day, period), assignments in self.solution.items():
            solution_dict[f"{day}_{period}"] = assignments
            
        return {
            "solution": solution_dict,
            "teachers": self.teachers,
            "subjects": self.subjects,
            "classes": self.classes,
            "rooms": self.rooms,
            "days": self.days,
            "periods": self.periods,
            "break_periods": [[day, period] for day, period in self.break_periods]
        }


# BytePlus Cloud Function handler
def handler(event, context):
    try:
        # Parse input from request
        if isinstance(event, str):
            data = json.loads(event)
        else:
            # Check if the data is in the 'body' field (common for HTTP triggers)
            if 'body' in event:
                if isinstance(event['body'], str):
                    data = json.loads(event['body'])
                else:
                    data = event['body']
            else:
                data = event
        
        print("Processed data:", data)
            
        # Extract basic data
        teachers = data.get('teachers', [])
        subjects = data.get('subjects', [])
        classes = data.get('classes', [])
        rooms = data.get('rooms', [])
        days = data.get('days', [])
        periods = data.get('periods', [])
        
        # Check which fields are missing and provide specific error messages
        missing_fields = []
        if not teachers:
            missing_fields.append("teachers")
        if not subjects:
            missing_fields.append("subjects")
        if not classes:
            missing_fields.append("classes")
        if not rooms:
            missing_fields.append("rooms")
        if not days:
            missing_fields.append("days")
        if not periods:
            missing_fields.append("periods")
            
        if missing_fields:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": f"Missing required data: {', '.join(missing_fields)}"})
            }
        
        # Perform pre-solve feasibility check to identify obvious issues
        feasibility_issues = check_basic_feasibility(data)
        if feasibility_issues:
            return {
                "statusCode": 400, 
                "body": json.dumps({
                    "error": "Problem is likely infeasible",
                    "issues": feasibility_issues
                })
            }
        
        # Initialize scheduler
        scheduler = SchoolScheduler(teachers, subjects, classes, rooms, days, periods)
        
        # Set constraints
        if 'teacher_subjects' in data:
            scheduler.set_teacher_subjects(data.get('teacher_subjects', {}))
            
        if 'teacher_classes' in data:
            scheduler.set_teacher_classes(data.get('teacher_classes', {}))
            
        if 'class_subjects' in data:
            scheduler.set_class_subjects(data.get('class_subjects', {}))
            
        if 'subject_constraints' in data:
            scheduler.set_subject_constraints(data.get('subject_constraints', {}))
            
        if 'class_rankings' in data:
            scheduler.set_class_rankings(data.get('class_rankings', {}))
            
        if 'room_suitability' in data:
            scheduler.set_room_suitability(data.get('room_suitability', {}))
        
        # Set fixed assignments
        if 'fixed_assignments' in data:
            for assignment in data.get('fixed_assignments', []):
                teacher = assignment.get('teacher')
                class_id = assignment.get('class')
                subject = assignment.get('subject')
                if all([teacher, class_id, subject]):
                    scheduler.add_fixed_assignment(teacher, class_id, subject)
        
        # Set additional constraints
        if 'teacher_unavailability' in data:
            # Convert string keys back to tuples
            teacher_unavailability = {}
            for teacher, unavailability in data.get('teacher_unavailability', {}).items():
                teacher_unavailability[teacher] = [(day, period) for [day, period] in unavailability]
            scheduler.set_teacher_unavailability(teacher_unavailability)
            
        if 'teacher_preferences' in data:
            # Convert string keys back to tuples
            teacher_preferences = {}
            for teacher, preferences in data.get('teacher_preferences', {}).items():
                teacher_preferences[teacher] = {(day, period): score for (day, period, score) in preferences}
            scheduler.set_teacher_preferences(teacher_preferences)
            
        if 'consecutive_periods' in data:
            scheduler.set_consecutive_periods(data.get('consecutive_periods', {}))
            
        if 'break_periods' in data:
            # Convert list format back to tuples
            break_periods = [(day, period) for [day, period] in data.get('break_periods', [])]
            scheduler.set_break_periods(break_periods)
        
        # Solve the scheduling problem
        solution = scheduler.solve()
        
        if solution:
            return {
                "statusCode": 200,
                "body": json.dumps(scheduler.get_solution_json())
            }
        else:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "No valid solution found that meets all hard constraints"})
            }
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }

def check_basic_feasibility(data):
    """Check for obvious infeasibilities before solving."""
    issues = []
    
    # Calculate available teaching slots
    days = data.get('days', [])
    periods = data.get('periods', [])
    break_periods = data.get('break_periods', [])
    
    total_periods = len(days) * len(periods)
    break_count = len(break_periods)
    available_periods = total_periods - break_count
    
    # Check teacher workload feasibility
    if 'teacher_subjects' in data and 'teacher_classes' in data and 'class_subjects' in data:
        teacher_subjects = data.get('teacher_subjects', {})
        teacher_classes = data.get('teacher_classes', {})
        class_subjects = data.get('class_subjects', {})
        teacher_unavailability = data.get('teacher_unavailability', {})
        
        for teacher, subjects in teacher_subjects.items():
            classes = teacher_classes.get(teacher, [])
            unavailable_count = len(teacher_unavailability.get(teacher, []))
            
            # Count how many periods this teacher would need to teach
            required_periods = 0
            for class_id in classes:
                for subject in subjects:
                    if subject in class_subjects.get(class_id, {}):
                        required_periods += class_subjects[class_id][subject]
            
            teacher_available_periods = available_periods - unavailable_count
            
            if required_periods > teacher_available_periods:
                issues.append({
                    "type": "teacher_overload",
                    "teacher": teacher,
                    "required_periods": required_periods,
                    "available_periods": teacher_available_periods,
                    "explanation": f"Teacher {teacher} needs to teach {required_periods} periods but only has {teacher_available_periods} available periods"
                })
                
    # Check for subject-teacher coverage
    if 'teacher_subjects' in data and 'class_subjects' in data:
        teacher_subjects = data.get('teacher_subjects', {})
        class_subjects = data.get('class_subjects', {})
        
        # Invert teacher_subjects to get subject -> teachers mapping
        subject_teachers = {}
        for teacher, subjects in teacher_subjects.items():
            for subject in subjects:
                if subject not in subject_teachers:
                    subject_teachers[subject] = []
                subject_teachers[subject].append(teacher)
        
        # Check if any required subject has no teachers
        for class_id, subjects in class_subjects.items():
            for subject, periods in subjects.items():
                if periods > 0 and (subject not in subject_teachers or not subject_teachers[subject]):
                    issues.append({
                        "type": "no_teachers_for_subject",
                        "subject": subject,
                        "class": class_id,
                        "explanation": f"Subject {subject} is required for class {class_id} but no teachers can teach it"
                    })
    
    # Check for subject-class-teacher compatibility
    if 'teacher_subjects' in data and 'teacher_classes' in data and 'class_subjects' in data:
        teacher_subjects = data.get('teacher_subjects', {})
        teacher_classes = data.get('teacher_classes', {})
        class_subjects = data.get('class_subjects', {})
        
        for class_id, subjects in class_subjects.items():
            for subject, periods in subjects.items():
                if periods > 0:
                    # Find teachers who can teach this subject to this class
                    capable_teachers = []
                    for teacher, teacher_subject_list in teacher_subjects.items():
                        if subject in teacher_subject_list and class_id in teacher_classes.get(teacher, []):
                            capable_teachers.append(teacher)
                    
                    if not capable_teachers:
                        issues.append({
                            "type": "no_capable_teachers",
                            "subject": subject,
                            "class": class_id,
                            "explanation": f"No teachers can teach {subject} to class {class_id}"
                        })
    
    return issues 