from ortools.sat.python import cp_model
from collections import defaultdict

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
            
            self.solution = solution
            return solution
        else:
            print(f"No solution found. Status: {status}")
            return None
    
    def print_schedule(self):
        """Print the timetable in a user-friendly format."""
        if not self.solution:
            print("No schedule to print. Please solve the model first.")
            return
        
        print("\n=== SCHOOL TIMETABLE ===")
        
        # Print class schedules
        for class_id in self.classes:
            print(f"\n--- CLASS: {class_id} ---")
            
            # Header
            header = f"{'Period':<10}"
            for day in self.days:
                header += f"{day:<20}"
            print(header)
            print("-" * len(header))
            
            # Rows
            for period in self.periods:
                row = f"{period:<10}"
                for day in self.days:
                    cell = ""
                    # Check if this is a break period
                    if (day, period) in self.break_periods:
                        cell = "BREAK"
                    else:
                        for assignment in self.solution.get((day, period), []):
                            if assignment["class"] == class_id:
                                cell = f"{assignment['subject']} ({assignment['teacher']}, {assignment['room']})"
                    row += f"{cell:<20}"
                print(row)
        
        # Print teacher schedules
        for teacher in self.teachers:
            print(f"\n--- TEACHER: {teacher} ---")
            
            # Header
            header = f"{'Period':<10}"
            for day in self.days:
                header += f"{day:<20}"
            print(header)
            print("-" * len(header))
            
            # Rows
            for period in self.periods:
                row = f"{period:<10}"
                for day in self.days:
                    cell = ""
                    # Check if this is a break period
                    if (day, period) in self.break_periods:
                        cell = "BREAK"
                    else:
                        for assignment in self.solution.get((day, period), []):
                            if assignment["teacher"] == teacher:
                                cell = f"{assignment['subject']} ({assignment['class']}, {assignment['room']})"
                    row += f"{cell:<20}"
                print(row)
        
        # Print room utilization
        for room in self.rooms:
            print(f"\n--- ROOM: {room} ---")
            
            # Header
            header = f"{'Period':<10}"
            for day in self.days:
                header += f"{day:<20}"
            print(header)
            print("-" * len(header))
            
            # Rows
            for period in self.periods:
                row = f"{period:<10}"
                for day in self.days:
                    cell = ""
                    # Check if this is a break period
                    if (day, period) in self.break_periods:
                        cell = "BREAK"
                    else:
                        for assignment in self.solution.get((day, period), []):
                            if assignment["room"] == room:
                                cell = f"{assignment['subject']} ({assignment['teacher']}, {assignment['class']})"
                    row += f"{cell:<20}"
                print(row)


# Example usage
if __name__ == "__main__":
    # Define basic data
    teachers = ["Smith", "Jones", "Wilson", "Brown", "Davis"]
    subjects = ["Math", "Science", "English", "History", "PE"]
    classes = ["10A", "10B", "11A", "11B", "12A"]
    rooms = ["R101", "R102", "R103", "Lab1", "Gym"]
    days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    periods = ["P1", "P2", "P3", "P4", "P5", "P6"]
    
    # Initialize scheduler
    scheduler = SchoolScheduler(teachers, subjects, classes, rooms, days, periods)
    
    # Define which subjects each teacher can teach
    teacher_subjects = {
        "Smith": ["Math", "Science"],
        "Jones": ["English", "History"],
        "Wilson": ["Math", "PE"],
        "Brown": ["Science", "Math"],
        "Davis": ["History", "English"]
    }
    scheduler.set_teacher_subjects(teacher_subjects)
    
    # Define which classes each teacher teaches
    teacher_classes = {
        "Smith": ["10A", "11A", "12A"],
        "Jones": ["10A", "10B", "11B"],
        "Wilson": ["10B", "11A", "12A"],
        "Brown": ["10A", "10B", "11B"],
        "Davis": ["11A", "11B", "12A"]
    }
    scheduler.set_teacher_classes(teacher_classes)
    
    # Define how many periods of each subject each class needs per week
    class_subjects = {
        "10A": {"Math": 5, "Science": 4, "English": 5, "History": 3, "PE": 2},
        "10B": {"Math": 5, "Science": 4, "English": 5, "History": 3, "PE": 2},
        "11A": {"Math": 5, "Science": 5, "English": 4, "History": 4, "PE": 2},
        "11B": {"Math": 5, "Science": 5, "English": 4, "History": 4, "PE": 2},
        "12A": {"Math": 6, "Science": 6, "English": 5, "History": 3, "PE": 0}
    }
    scheduler.set_class_subjects(class_subjects)
    
    # Define min/max daily periods for each subject
    subject_constraints = {
        "Math": (0, 2),
        "Science": (0, 2),
        "English": (0, 2),
        "History": (0, 1),
        "PE": (0, 1)
    }
    scheduler.set_subject_constraints(subject_constraints)
    
    # Define class rankings (higher = better)
    class_rankings = {
        "10A": 8,  # Good class
        "10B": 4,  # Poor class
        "11A": 8,  # Good class
        "11B": 4,  # Poor class
        "12A": 7   # Average class
    }
    scheduler.set_class_rankings(class_rankings)
    
    # Define room suitability for each subject
    room_suitability = {
        "Science": ["Lab1", "R101"],
        "PE": ["Gym"],
        "Math": ["R101", "R102", "R103"],
        "English": ["R101", "R102", "R103"],
        "History": ["R101", "R102", "R103"]
    }
    scheduler.set_room_suitability(room_suitability)
    
    # Add some fixed assignments
    scheduler.add_fixed_assignment("Smith", "12A", "Math")
    scheduler.add_fixed_assignment("Davis", "11A", "History")
    
    # NEW FEATURES EXAMPLES:
    
    # 1. Set teacher unavailability
    teacher_unavailability = {
        "Smith": [("Mon", "P1"), ("Fri", "P6")],  # Smith is unavailable Monday 1st period and Friday last period
        "Jones": [("Wed", "P3"), ("Wed", "P4")]   # Jones is unavailable Wednesday periods 3 and 4
    }
    scheduler.set_teacher_unavailability(teacher_unavailability)
    
    # 2. Set teacher timeslot preferences (higher score = more preferred)
    teacher_preferences = {
        "Wilson": {("Mon", "P1"): 10, ("Mon", "P2"): 8},  # Wilson prefers Monday morning
        "Brown": {("Fri", "P5"): 10, ("Fri", "P6"): 10}   # Brown prefers Friday afternoon
    }
    scheduler.set_teacher_preferences(teacher_preferences)
    
    # 3. Set subjects requiring consecutive periods
    consecutive_periods = {
        "Science": 2  # Science requires at least 2 consecutive periods (for lab work)
    }
    scheduler.set_consecutive_periods(consecutive_periods)
    
    # 4. Set break/lunch periods
    break_periods = [
        ("Mon", "P3"),  # Monday period 3 is lunch
        ("Tue", "P3"),  # Tuesday period 3 is lunch
        ("Wed", "P3"),  # Wednesday period 3 is lunch
        ("Thu", "P3"),  # Thursday period 3 is lunch
        ("Fri", "P3")   # Friday period 3 is lunch
    ]
    scheduler.set_break_periods(break_periods)
    
    # Solve and print the schedule
    solution = scheduler.solve()
    if solution:
        scheduler.print_schedule()
