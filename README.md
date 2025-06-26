# School Timetable Scheduler

A comprehensive school timetable scheduling system with an intuitive web-based UI and a BytePlus cloud function backend. The system solves complex scheduling problems using constraint programming with Google's OR-Tools.

## Features

- Automatic timetable generation based on multiple constraints
- Intuitive step-by-step web interface
- Support for:
  - Multiple teachers, subjects, classes, and rooms
  - Teacher subject qualifications and class assignments
  - Room suitability for different subjects
  - Break periods and teacher unavailability
  - Teacher time preferences
  - Consecutive period requirements
  - Fixed assignments
  - Class ranking and workload balancing

## Project Structure

- `index.html` - Main web interface with Tailwind CSS
- `script.js` - Frontend JavaScript for the web interface
- `scheduler_cloud_function.py` - BytePlus cloud function for timetable generation
- `school_scheduler.py` - Original scheduler implementation (standalone version)
- `deploy.sh` - Deployment script for BytePlus cloud function
- `local-server.py` - Local development server for testing the frontend
- `requirements.txt` - Python package dependencies

## Deployment Instructions

### Backend Deployment (BytePlus Cloud Function)

#### Automatic Deployment

1. Make sure you have the BytePlus CLI installed
2. Run the deployment script:
   ```bash
   ./deploy.sh
   ```
3. Follow the prompts to deploy your cloud function

#### Manual Deployment

1. **Install BytePlus CLI** (if not already installed)

   Follow the BytePlus CLI installation instructions from the official documentation.

2. **Deploy the cloud function**

   ```bash
   # Login to BytePlus
   byteplus login

   # Create a new function
   byteplus function create --name school-scheduler

   # Deploy the function
   byteplus function deploy --name school-scheduler --file scheduler_cloud_function.py --handler handler --runtime python3.9
   ```

3. **Configure Dependencies**

   Create a `requirements.txt` file with the following content:
   ```
   ortools==9.3.10497
   ```

   Upload the requirements:
   ```bash
   byteplus function update --name school-scheduler --requirements requirements.txt
   ```

4. **Configure Environment**

   Increase the function timeout and memory if needed:
   ```bash
   byteplus function update --name school-scheduler --timeout 60 --memory 512
   ```

5. **Get Function URL**

   ```bash
   byteplus function get-url --name school-scheduler
   ```

   Update the `apiUrl` in `script.js` with the provided URL.

### Frontend Deployment

#### Local Development Server

For quick local testing, use the included Python server script:

```bash
# Start the local development server
./local-server.py
```

This will automatically open your browser to http://localhost:8000/

#### Production Deployment

1. **Setup a web server**

   You can use any web server or static site hosting service like Nginx, Apache, GitHub Pages, or cloud services like AWS S3 + CloudFront.

2. **Deploy the files**

   Upload the following files to your web server:
   - `index.html`
   - `script.js`

3. **Update API URL**

   In `script.js`, find the line with:
   ```javascript
   const apiUrl = 'https://your-byteplus-function-url.example.com';
   ```
   
   Replace it with your actual BytePlus function URL.

## Docker Deployment

The timetable scheduler can be easily deployed using Docker. Follow these steps to deploy it to your testing server:

### Prerequisites

- Docker installed on your server
- Docker Compose installed on your server

### Deployment Steps

1. Clone the repository to your server:
   ```bash
   git clone <repository-url>
   cd timetable-scheduler
   ```

2. Build and start the Docker container:
   ```bash
   docker-compose up -d
   ```

3. Access the application at:
   ```
   http://your-server-ip:8000
   ```

4. To stop the application:
   ```bash
   docker-compose down
   ```

### Configuration

- The application runs on port 8000 by default. To change this, modify the `ports` section in the `docker-compose.yml` file.
- The application code is mounted as a volume, so you can make changes to the code without rebuilding the container.

### Logs

To view the logs:
```bash
docker-compose logs -f
```

## Usage Guide

1. **Basic Setup**
   - Enter the lists of teachers, subjects, classes, rooms, days, and periods
   - Each item should be on a separate line

2. **Teacher & Subject Mapping**
   - Select which subjects each teacher can teach
   - Specify which classes each teacher is assigned to

3. **Class & Room Setup**
   - Set the number of periods per week for each class-subject combination
   - Configure min/max daily periods for each subject
   - Specify which rooms are suitable for each subject
   - Set class rankings (higher ranking means better class)

4. **Advanced Constraints**
   - Mark break periods in the timetable
   - Set periods when teachers are unavailable
   - Configure teacher preferences for specific timeslots
   - Specify subjects that require consecutive periods
   - Add fixed teacher-class-subject assignments

5. **Generate & View Results**
   - Click "Generate Schedule" to create the timetable
   - Switch between room, teacher, and class views
   - Select specific entities to view their schedules
   - Download timetables in CSV format

## Customization

- **Styling**: The UI uses Tailwind CSS, which can be easily customized
- **Solver Parameters**: You can adjust the solver parameters in `scheduler_cloud_function.py`
- **Additional Constraints**: Extend the scheduler class to add more constraints

## Dependencies

- Frontend: Tailwind CSS (loaded via CDN)
- Backend: 
  - Python 3.9+
  - Google OR-Tools (constraint programming solver)

## License

MIT License 