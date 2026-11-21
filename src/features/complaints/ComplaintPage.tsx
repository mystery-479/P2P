import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AlertIcon } from "../../components/Icons";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { DemoNotice } from "../../components/DemoNotice";
import { Field } from "../../components/Field";
import { HeroSketch } from "../../components/HeroSketch";
import { Select, TextArea, TextInput } from "../../components/Inputs";
import { createTicket } from "../../lib/ticketStore";
import { LANGUAGES } from "../../types/ticket";
import { PhotoUpload } from "./PhotoUpload";

type Errors = Record<string, string>;
type SubmitState = "idle" | "submitting" | "error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d][\d\s-]{5,}$/;

export function ComplaintPage() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);

  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState<string>("English");
  const [locationText, setLocationText] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [contactName, setContactName] = useState("");
  const [contactDetail, setContactDetail] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  // submitError state removed; the error banner uses a fixed friendly message.
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  function validate(): Errors {
    const next: Errors = {};
    const text = description.trim();

    if (text.length < 10) next.description = "A few more words would help — what did you notice?";
    else if (text.length > 2000) next.description = "Please keep the description under 2000 characters.";

    if (locationText.trim().length < 3) {
      next.location = "Where did you see it? An address, landmark or map pin will do.";
    }

    const detail = contactDetail.trim();
    if (detail && !EMAIL_PATTERN.test(detail) && !PHONE_PATTERN.test(detail)) {
      next.contactDetail = "Enter a valid email address or phone number.";
    }

    return next;
  }

  function focusFirstError(nextErrors: Errors) {
    const firstKey = Object.keys(nextErrors)[0];
    if (!firstKey) return;
    requestAnimationFrame(() => {
      const target = formRef.current?.querySelector<HTMLElement>(`#complaint-${firstKey}`);
      target?.focus();
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitState === "submitting") return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors);
      return;
    }

    setSubmitState("submitting");
    try {
      // Small delay makes the analysing state visible in the demo.
      await new Promise((resolve) => setTimeout(resolve, 700));
      const ticket = createTicket({
        description,
        language,
        location: locationText,
        ...(photoUrl ? { photoUrl } : {}),
      });
      navigate(`/confirmation/${ticket.id}`, {
        state: {
          contact: {
            name: contactName.trim(),
            detail: contactDetail.trim(),
          },
        },
      });
    } catch {
      setSubmitState("error");
    }
  }

  function useMyLocation() {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("Location is not supported by this browser. Please type an address instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationText(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setErrors((current) => ({ ...current, location: "" }));
        setLocating(false);
      },
      () => {
        setGeoError("Location access was denied. Please type the address or landmark manually.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  }

  return (
    <div className="page page--report">
      <div className="page-heading">
        <p className="eyebrow">Citizen reporting</p>
        <h1>Spotted something that needs fixing?</h1>
        <p className="page-heading__lede">
          Tell us what you saw, in your own words. We'll turn it into a ticket, suggest a
          priority, and route it to the right team — a real officer reviews every
          recommendation.
        </p>
        <div className="hero-sketch">
          <HeroSketch />
        </div>
      </div>

      <div className="report-layout">
        <Card className="report-card">
          <form ref={formRef} onSubmit={(event) => void handleSubmit(event)} noValidate>
            <fieldset disabled={submitState === "submitting"} className="form-fields">
              <legend className="sr-only">Complaint details</legend>

              <Field
                id="complaint-description"
                label="What is the issue?"
                hint="Write freely in English or a regional language. Include any danger you noticed."
                error={errors.description}
              >
                <TextArea
                  id="complaint-description"
                  name="description"
                  rows={6}
                  maxLength={2000}
                  placeholder="e.g. A large pothole near the bus stop is making traffic swerve into oncoming cars…"
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    setErrors((current) => ({ ...current, description: "" }));
                  }}
                  invalid={Boolean(errors.description)}
                />
              </Field>

              <div className="field-row">
                <Field
                  id="complaint-language"
                  label="Language of your report"
                  hint="Non-English reports are flagged for human review in this demo."
                >
                  <Select
                    id="complaint-language"
                    name="language"
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                  >
                    {LANGUAGES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field id="complaint-location" label="Where is it?" error={errors.location}>
                  <div className="input-with-action">
                    <TextInput
                      id="complaint-location"
                      name="location"
                      type="text"
                      placeholder="Address, landmark or map pin"
                      value={locationText}
                      onChange={(event) => {
                        setLocationText(event.target.value);
                        setErrors((current) => ({ ...current, location: "" }));
                      }}
                      invalid={Boolean(errors.location)}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={useMyLocation}
                      loading={locating}
                    >
                      Use my location
                    </Button>
                  </div>
                  {geoError && (
                    <p className="field__hint field__hint--error" role="alert">
                      {geoError}
                    </p>
                  )}
                </Field>
              </div>

              <Field id="complaint-photo" label="Photo" optional hint="A photo makes it much easier for an officer to see what you see.">
                <PhotoUpload value={photoUrl} onChange={setPhotoUrl} error={errors.photo} />
              </Field>

              <div className="form-divider" role="presentation" />

              <fieldset className="contact-group">
                <legend>Contact details (optional)</legend>
                <p className="contact-group__note">
                  Only used if an officer needs to follow up with you. Not shown on the public
                  dashboard and not stored in the demo ticket.
                </p>
                <div className="field-row">
                  <Field id="complaint-contactName" label="Your name" optional>
                    <TextInput
                      id="complaint-contactName"
                      name="contactName"
                      type="text"
                      autoComplete="name"
                      placeholder="Your name"
                      value={contactName}
                      onChange={(event) => setContactName(event.target.value)}
                    />
                  </Field>
                  <Field
                    id="complaint-contactDetail"
                    label="Email or phone"
                    optional
                    error={errors.contactDetail}
                  >
                    <TextInput
                      id="complaint-contactDetail"
                      name="contactDetail"
                      type="text"
                      autoComplete="email"
                      placeholder="you@example.com or 9876543210"
                      value={contactDetail}
                      onChange={(event) => {
                        setContactDetail(event.target.value);
                        setErrors((current) => ({ ...current, contactDetail: "" }));
                      }}
                      invalid={Boolean(errors.contactDetail)}
                    />
                  </Field>
                </div>
              </fieldset>
            </fieldset>

            {submitState === "error" && (
              <p className="form-alert" role="alert">
                <AlertIcon />
                Sorry, something went wrong saving your report.
                Please try again.
              </p>
            )}

            <div className="form-actions">
              <Button type="submit" size="lg" loading={submitState === "submitting"} fullWidth>
                {submitState === "submitting" ? "We're looking at your report now…" : "Send my report"}
              </Button>
              <p className="form-actions__note">You will get a ticket ID on the next screen.</p>
            </div>
          </form>
        </Card>

        <aside className="report-aside" aria-label="How TownThread works">
          <DemoNotice />
          <Card className="steps-card">
            <h2>What happens next</h2>
            <ol className="steps">
              <li>
                <span className="steps__number">1</span>
                <div>
                  <strong>Categorised</strong>
                  <p>Issue is matched to roads, waste, water, electricity, trees, drainage or other.</p>
                </div>
              </li>
              <li>
                <span className="steps__number">2</span>
                <div>
                  <strong>Prioritised</strong>
                  <p>Severity of Low to Critical is suggested with a short reason.</p>
                </div>
              </li>
              <li>
                <span className="steps__number">3</span>
                <div>
                  <strong>Routed</strong>
                  <p>The right municipal department is recommended for action.</p>
                </div>
              </li>
            </ol>
          </Card>
          <Card className="safety-card">
            <h2>Urgent danger?</h2>
            <p>
              TownThread is not an emergency service. For fires, accidents or immediate risk to life,
              contact your local emergency number first.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
