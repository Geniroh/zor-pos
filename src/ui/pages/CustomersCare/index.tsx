import { Link } from "react-router-dom";
import { Users, CalendarCheck, Stethoscope, FolderHeart } from "lucide-react";
import careImg from "../../../../images/img1.png";
import { CARE_CUSTOMERS, PATIENTS, FOLLOW_UPS, CARE_ACTIVITIES } from "../../components/care/care-data";
import "../../components/common/folder-cards.css";
import "./index.css";

const scheduledFollowUps = FOLLOW_UPS.filter((f) => f.status === "Scheduled").length;
const consultations = CARE_ACTIVITIES.length;

const CARE_SECTIONS = [
  {
    icon: Users,
    title: "Customer Profile",
    subtitle: "Every customer, their purchases and activity",
    meta: CARE_CUSTOMERS.length + " customers",
    path: "directory",
    tint: "green" as const,
  },
  {
    icon: CalendarCheck,
    title: "Follow-ups & Outreach",
    subtitle: "The care queue, plus refill and win-back lists",
    meta: scheduledFollowUps + " scheduled",
    path: "follow-ups",
    tint: "navy" as const,
  },
  {
    icon: Stethoscope,
    title: "Clinical Consultations",
    subtitle: "Consultation notes and counselling records",
    meta: consultations + " logged",
    path: "consultations",
    tint: "sand" as const,
  },
  {
    icon: FolderHeart,
    title: "Patient Folders",
    subtitle: "Customers with a clinical file — allergies, medications",
    meta: PATIENTS.length + " patients",
    path: "patients",
    tint: "plum" as const,
  },
];

function CustomersCare() {
  return (
    <div className="care-page">
      <h1>Customers &amp; Care</h1>
      <p className="care-subtitle">
        Know who your customers are, and look after the ones you care for.
      </p>

      <div className="care-body">
        <div className="care-illustration">
          <img src={careImg} alt="" />
        </div>

        <div className="folder-grid care-folders">
          {CARE_SECTIONS.map(({ icon: Icon, title, subtitle, meta, path, tint }) => (
            <Link key={path} to={path} className={"folder-card folder-" + tint}>
              <span className="folder-card-tab" />
              <span className="folder-card-body">
                <span className="folder-card-icon">
                  <Icon className="folder-card-glyph" />
                </span>
                <span className="folder-card-text">
                  <strong>{title}</strong>
                  <span>{subtitle}</span>
                </span>
                <span className="folder-card-meta">{meta}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CustomersCare;
