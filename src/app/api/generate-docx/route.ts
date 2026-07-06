import { NextRequest, NextResponse } from "next/server";
import {
  Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, ShadingType, LevelFormat
} from "docx";
import { createClient } from "@/lib/supabase/server";
import { guardFeature } from "@/lib/plan-guard";

// ── Couleurs de la charte graphique ──────────────────────────────────────────
const COLORS = {
  primary: "1B4F8A",
  secondary: "2E75B6",
  accent: "E8F0FA",
  text: "1A1A1A",
  textLight: "555555",
  white: "FFFFFF",
  border: "D0DCF0",
};

const PAGE = {
  width: 11906,
  height: 16838,
  marginH: 851,
  marginV: 720,
};

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth ──────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // ── 2. Guard plan ────────────────────────────────────────────────────────
    const { allowed, plan } = await guardFeature(user.id, "docx_export");
    if (!allowed) {
      return NextResponse.json(
        { error: `L'export .docx requiert le plan Pro ou Premium. Plan actuel : ${plan}` },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { documentType, cvContent, coverLetterContent } = body;
    // documentType: "cv" | "cover_letter"
    // cvContent: tailored_cv object from AIGenerationResponse (pre-generated)
    // coverLetterContent: cover_letter object from AIGenerationResponse (pre-generated)

    if (!cvContent && !coverLetterContent) {
      return NextResponse.json({ error: "Aucun contenu fourni" }, { status: 400 });
    }

    // ── 3. Construction du .docx depuis les données déjà générées ────────────
    const sections = [];

    if ((documentType === "cv" || documentType === "both") && cvContent) {
      sections.push(buildCVSection(cvContent));
    }

    if ((documentType === "cover_letter" || documentType === "both") && coverLetterContent) {
      sections.push(buildCoverLetterSection(coverLetterContent));
    }

    if (sections.length === 0) {
      return NextResponse.json({ error: "Aucun contenu à exporter" }, { status: 400 });
    }

    const doc = new Document({
      creator: "Postulis",
      title: documentType === "cv" ? "CV Tailored" : "Cover Letter",
      description: "Document généré par Postulis",
      numbering: {
        config: [{
          reference: "bullets",
          levels: [{
            level: 0,
            format: LevelFormat.BULLET,
            text: "▸",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: { indent: { left: 360, hanging: 240 }, spacing: { after: 40 } },
              run: { color: COLORS.secondary, size: 18 },
            },
          }],
        }],
      },
      styles: {
        default: {
          document: { run: { font: "Calibri", size: 20, color: COLORS.text } },
        },
      },
      sections,
    });

    const buffer = await Packer.toBuffer(doc);

    const filename = documentType === "cv"
      ? `CV_Postulis.docx`
      : `CoverLetter_Postulis.docx`;

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error("[DOCX_GENERATION_ERROR]", error);
    return NextResponse.json({ error: "Erreur lors de la génération du document" }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTRUCTEUR CV depuis tailored_cv (AIGenerationResponse.tailored_cv)
// ═══════════════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCVSection(cv: any) {
  const children: Paragraph[] = [];

  // ── EN-TÊTE ────────────────────────────────────────────────────────────────
  if (cv.header_section) {
    const lines = cv.header_section.split('\n').filter(Boolean);
    const nameLine = lines[0] ?? '';
    const contactLine = lines.slice(1).join('  •  ');

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 60 },
        children: [new TextRun({ text: nameLine.toUpperCase(), bold: true, size: 52, color: COLORS.primary, font: "Calibri" })],
      }),
    );

    if (contactLine) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: COLORS.secondary, space: 6 } },
          children: [new TextRun({ text: contactLine, size: 18, color: COLORS.textLight })],
        })
      );
    }
  }

  // ── RÉSUMÉ ──────────────────────────────────────────────────────────────────
  if (cv.summary_section) {
    children.push(
      buildSectionHeader("PROFIL PROFESSIONNEL"),
      new Paragraph({
        spacing: { after: 200 },
        shading: { fill: COLORS.accent, type: ShadingType.CLEAR },
        border: { left: { style: BorderStyle.SINGLE, size: 16, color: COLORS.secondary, space: 8 } },
        indent: { left: 180 },
        children: [new TextRun({ text: cv.summary_section, size: 20, color: COLORS.text, italics: true })],
      })
    );
  }

  // ── EXPÉRIENCES ────────────────────────────────────────────────────────────
  if (cv.experience_section) {
    children.push(buildSectionHeader("EXPÉRIENCES PROFESSIONNELLES"));
    const lines = cv.experience_section.split('\n');
    lines.forEach((line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const isBullet = trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('▸');
      children.push(
        isBullet
          ? new Paragraph({
              numbering: { reference: "bullets", level: 0 },
              spacing: { after: 40 },
              children: [new TextRun({ text: trimmed.replace(/^[-•▸]\s*/, ''), size: 19, color: COLORS.text })],
            })
          : new Paragraph({
              spacing: { before: 80, after: 20 },
              children: [new TextRun({ text: trimmed, bold: true, size: 21, color: COLORS.primary })],
            })
      );
    });
    children.push(spacer(80));
  }

  // ── FORMATION ──────────────────────────────────────────────────────────────
  if (cv.education_section) {
    children.push(buildSectionHeader("FORMATION"));
    const lines = cv.education_section.split('\n');
    lines.forEach((line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      children.push(
        new Paragraph({
          spacing: { before: 60, after: 20 },
          children: [new TextRun({ text: trimmed, size: 20, color: COLORS.text })],
        })
      );
    });
    children.push(spacer(80));
  }

  // ── COMPÉTENCES ────────────────────────────────────────────────────────────
  if (cv.skills_section) {
    children.push(buildSectionHeader("COMPÉTENCES"));
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 40 },
        children: [new TextRun({ text: cv.skills_section, size: 20, color: COLORS.text })],
      })
    );
  }

  // ── PROJETS ────────────────────────────────────────────────────────────────
  if (cv.projects_section) {
    children.push(buildSectionHeader("PROJETS"));
    const lines = cv.projects_section.split('\n');
    lines.forEach((line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      children.push(
        new Paragraph({
          spacing: { before: 40, after: 20 },
          children: [new TextRun({ text: trimmed, size: 19, color: COLORS.text })],
        })
      );
    });
  }

  // ── CERTIFICATIONS ─────────────────────────────────────────────────────────
  if (cv.certifications_section) {
    children.push(buildSectionHeader("CERTIFICATIONS"));
    children.push(
      new Paragraph({
        spacing: { before: 60, after: 20 },
        children: [new TextRun({ text: cv.certifications_section, size: 20, color: COLORS.text })],
      })
    );
  }

  // ── LANGUES ────────────────────────────────────────────────────────────────
  if (cv.languages_section) {
    children.push(buildSectionHeader("LANGUES"));
    children.push(
      new Paragraph({
        spacing: { before: 60, after: 20 },
        children: [new TextRun({ text: cv.languages_section, size: 20, color: COLORS.text })],
      })
    );
  }

  return {
    properties: {
      page: {
        size: { width: PAGE.width, height: PAGE.height },
        margin: { top: PAGE.marginV, right: PAGE.marginH, bottom: PAGE.marginV, left: PAGE.marginH },
      },
    },
    children,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTRUCTEUR LETTRE depuis cover_letter (AIGenerationResponse.cover_letter)
// ═══════════════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCoverLetterSection(cl: any) {
  const children: Paragraph[] = [];

  const fullText = cl.full_letter_text ?? [
    cl.opening_paragraph,
    cl.body_paragraph_1,
    cl.body_paragraph_2,
    cl.closing_paragraph,
  ].filter(Boolean).join('\n\n');

  const paragraphs = fullText.split('\n\n').filter(Boolean);

  paragraphs.forEach((para: string, i: number) => {
    children.push(
      new Paragraph({
        spacing: { before: i === 0 ? 0 : 200, after: 200 },
        indent: { firstLine: i > 0 && i < paragraphs.length - 1 ? 720 : 0 },
        alignment: AlignmentType.JUSTIFIED,
        children: [new TextRun({ text: para.trim(), size: 20, color: COLORS.text })],
      })
    );
  });

  return {
    properties: {
      page: {
        size: { width: PAGE.width, height: PAGE.height },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    children,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildSectionHeader(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.primary, space: 4 } },
    children: [new TextRun({ text: title, bold: true, size: 24, color: COLORS.primary, font: "Calibri", allCaps: true })],
  });
}

function spacer(height: number): Paragraph {
  return new Paragraph({ spacing: { before: 0, after: height }, children: [] });
}
