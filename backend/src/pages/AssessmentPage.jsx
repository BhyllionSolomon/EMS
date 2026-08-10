import { useEffect, useState } from "react";
import axios from "axios";
import {
  ClipboardCheck,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

const SCORE_FIELDS = [
  {
    name: "dressing_appearance",
    label: "Dressing / Appearance",
    max: 10,
  },
  {
    name: "oral_presentation",
    label: "Oral Presentation",
    max: 10,
  },
  {
    name: "slide_presentation",
    label: "Slide Presentation",
    max: 10,
  },
  {
    name: "depth_of_understanding",
    label: "Depth of Understanding",
    max: 15,
  },
  {
    name: "project_implementation",
    label: "Project Implementation",
    max: 15,
  },
  {
    name: "referencing_documentation",
    label: "Referencing / Documentation",
    max: 15,
  },
  {
    name: "contribution_originality",
    label: "Contribution / Originality",
    max: 15,
  },
  {
    name: "professional_conduct",
    label: "Professional Conduct",
    max: 10,
  },
];

const INITIAL_FORM = {
  student_id: "",
  dressing_appearance: "",
  oral_presentation: "",
  slide_presentation: "",
  depth_of_understanding: "",
  project_implementation: "",
  referencing_documentation: "",
  contribution_originality: "",
  professional_conduct: "",
  remarks: "",
};

function AssessmentPage({ token }) {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);

  const [loadingStudents, setLoadingStudents] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      setLoadingStudents(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/students/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setStudents(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error("STUDENT LOAD ERROR:", err);

      if (err.response?.status === 401) {
        setError(
          "Your session has expired. Please log in again."
        );
      } else {
        setError("Unable to load students.");
      }
    } finally {
      setLoadingStudents(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setError("");
    setSuccess("");
  }

  const totalScore = SCORE_FIELDS.reduce(
    (total, field) => {
      const value = Number(form[field.name]);

      return (
        total +
        (Number.isFinite(value) ? value : 0)
      );
    },
    0
  );

  const recommendation =
    totalScore >= 50 ? "Pass" : "Fail";

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.student_id) {
      setError("Please select a student.");
      return;
    }

    for (const field of SCORE_FIELDS) {
      const value = Number(form[field.name]);

      if (
        form[field.name] === "" ||
        !Number.isFinite(value)
      ) {
        setError(
          `Please enter a valid score for ${field.label}.`
        );
        return;
      }

      if (value < 0 || value > field.max) {
        setError(
          `${field.label} must be between 0 and ${field.max}.`
        );
        return;
      }
    }

    try {
      setSubmitting(true);

      const payload = {
        student_id: Number(form.student_id),

        dressing_appearance: Number(
          form.dressing_appearance
        ),

        oral_presentation: Number(
          form.oral_presentation
        ),

        slide_presentation: Number(
          form.slide_presentation
        ),

        depth_of_understanding: Number(
          form.depth_of_understanding
        ),

        project_implementation: Number(
          form.project_implementation
        ),

        referencing_documentation: Number(
          form.referencing_documentation
        ),

        contribution_originality: Number(
          form.contribution_originality
        ),

        professional_conduct: Number(
          form.professional_conduct
        ),

        remarks:
          form.remarks.trim() || null,
      };

      const response = await axios.post(
        `${API_URL}/assessments/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(
        "ASSESSMENT CREATED:",
        response.data
      );

      setSuccess(
        `Assessment saved successfully. Total score: ${totalScore.toFixed(
          2
        )}/100 — ${recommendation}.`
      );

      setForm(INITIAL_FORM);
    } catch (err) {
      console.error(
        "ASSESSMENT SUBMIT ERROR:",
        err
      );

      if (err.response) {
        setError(
          err.response.data?.detail ||
            "Unable to save assessment."
        );
      } else {
        setError(
          "Unable to connect to the server."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="assessment-page">

      {/* PAGE HEADER */}
      <div className="assessment-page-header">

        <div className="assessment-title">

          <div className="assessment-title-icon">
            <ClipboardCheck size={25} />
          </div>

          <div>
            <h1>Student Assessment</h1>

            <p>
              Enter and submit the student's
              project assessment scores.
            </p>
          </div>

        </div>

      </div>

      {/* ERROR */}
      {error && (
        <div className="assessment-alert assessment-alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* SUCCESS */}
      {success && (
        <div className="assessment-alert assessment-alert-success">
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      <form
        className="assessment-form"
        onSubmit={handleSubmit}
      >

        {/* STUDENT INFORMATION */}
        <section className="assessment-panel">

          <div className="assessment-panel-header">

            <div>
              <h2>Student Information</h2>

              <p>
                Select the student being assessed.
              </p>
            </div>

          </div>

          <div className="assessment-panel-body">

            <div className="assessment-field">

              <label htmlFor="student_id">
                Student
              </label>

              <select
                id="student_id"
                name="student_id"
                value={form.student_id}
                onChange={handleChange}
                disabled={loadingStudents}
                required
              >

                <option value="">
                  {loadingStudents
                    ? "Loading students..."
                    : "Select a student"}
                </option>

                {students.map((student) => (
                  <option
                    key={student.id}
                    value={student.id}
                  >
                    {getStudentDisplayName(student)}
                  </option>
                ))}

              </select>

            </div>

          </div>

        </section>

        {/* ASSESSMENT SCORES */}
        <section className="assessment-panel">

          <div className="assessment-panel-header">

            <div>
              <h2>Assessment Scores</h2>

              <p>
                Enter the score obtained for
                each assessment criterion.
              </p>
            </div>

            <div className="assessment-total">

              <span>Total</span>

              <strong>
                {totalScore.toFixed(2)}
              </strong>

              <small>/ 100</small>

            </div>

          </div>

          <div className="assessment-panel-body">

            <div className="score-grid">

              {SCORE_FIELDS.map((field) => (
                <div
                  className="score-field"
                  key={field.name}
                >

                  <label htmlFor={field.name}>
                    {field.label}
                  </label>

                  <div className="score-input-wrapper">

                    <input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min="0"
                      max={field.max}
                      step="0.01"
                      value={form[field.name]}
                      onChange={handleChange}
                      placeholder="0"
                      required
                    />

                    <span>
                      / {field.max}
                    </span>

                  </div>

                </div>
              ))}

            </div>

            {/* RESULT PREVIEW */}
            <div className="assessment-result-preview">

              <div>

                <span>Current Total</span>

                <strong>
                  {totalScore.toFixed(2)} / 100
                </strong>

              </div>

              <div>

                <span>Recommendation</span>

                <strong
                  className={
                    recommendation === "Pass"
                      ? "assessment-pass"
                      : "assessment-fail"
                  }
                >
                  {recommendation}
                </strong>

              </div>

            </div>

          </div>

        </section>

        {/* REMARKS */}
        <section className="assessment-panel">

          <div className="assessment-panel-header">

            <div>

              <h2>Remarks</h2>

              <p>
                Add any additional comments
                about the student's assessment.
              </p>

            </div>

          </div>

          <div className="assessment-panel-body">

            <div className="assessment-field">

              <label htmlFor="remarks">
                Assessor Remarks
              </label>

              <textarea
                id="remarks"
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                rows="5"
                placeholder="Enter remarks about the student's performance..."
              />

            </div>

          </div>

        </section>

        {/* ACTIONS */}
        <div className="assessment-actions">

          <button
            type="button"
            className="assessment-reset-button"
            onClick={resetForm}
            disabled={submitting}
          >
            <RotateCcw size={18} />
            Clear
          </button>

          <button
            type="submit"
            className="assessment-submit-button"
            disabled={
              submitting || loadingStudents
            }
          >

            {submitting ? (
              <>
                <span className="spinner" />
                Saving Assessment...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Assessment
              </>
            )}

          </button>

        </div>

      </form>

    </div>
  );
}

/*
 * Gets a usable student name regardless of
 * which name field the API returns.
 */
function getStudentDisplayName(student) {

  if (student.full_name) {
    return `${student.full_name} — #${student.id}`;
  }

  if (student.name) {
    return `${student.name} — #${student.id}`;
  }

  if (student.student_name) {
    return `${student.student_name} — #${student.id}`;
  }

  if (student.matric_number) {
    return `${student.matric_number} — #${student.id}`;
  }

  if (student.registration_number) {
    return `${student.registration_number} — #${student.id}`;
  }

  return `Student #${student.id}`;
}

export default AssessmentPage;