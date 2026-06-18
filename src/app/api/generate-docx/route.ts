import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, ShadingType, LevelFormat
} from "docx";
import { createClient } from "@/lib/supabase/server";
import { guardFeature } from "@/lib/plan-guard";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ── Couleurs de la charte graphique ──────────────────────────────────────────
const COLORS = {
  primary: "1B4F8A",      // Bleu marine professionnel
  secondary: "2E75B6",    // Bleu moyen (accents)
  accent: "E8F0FA",       // Bleu très clair (fonds de sections)
  text: "1A1A1A",         // Noir doux
  textLight: "555555",    // Gris texte secondaire
  white: "FFFFFF",
  border: "D0DCF0",       // Bleu-gris clair pour les séparateurs
};

// ── Constantes de mise en page ────────────────────────────────────────────────
const PAGE = {
  width: 11906,           // A4 en DXA
  height: 16838,
  marginH: 851,           // ~1.5cm (marges horizontales serrées pour maximiser l'espace)
  marginV: 720,           // ~1.27cm (marges verticales)
  contentWidth: 10204,    // 11906 - 2 × 851
};

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth & Guard (BETA TESTING: Bypass guards) ───────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // const { allowed, plan } = await guardFeature(user.id, "docx_export");
    // if (!allowed) {
    //   return NextResponse.json(
    //     { error: `L'export .docx requiert le plan Pro ou Premium. Plan actuel : ${plan}` },
    //     { status: 403 }
    //   );
    // }

    const { userProfile, jobDescription, documentType, matchScoreResult } = await req.json();
    // documentType: "cv" | "cover_letter" | "both"

    let cvContent = null;
    let coverLetterContent = null;

    // ── Étape 1 : Génération du contenu par Claude ───────────────────────────
    if (documentType === "cv" || documentType === "both") {
      const cvResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 3000,
        system: `Tu es un expert en rédaction de CV ATS-optimisés pour le marché international.
Génère le contenu structuré d'un CV professionnel en JSON.
RÈGLES :
- RÈGLE CRITIQUE : N'invente AUCUNE expérience, AUCUN diplôme, ni AUCUNE entreprise. Utilise STRICTEMENT ET UNIQUEMENT les faits présents dans le PROFIL fourni. Ton rôle est d'exploiter et de reformuler son véritable parcours au maximum.
- Commence par les expériences les plus récentes (chronologie inversée)
- Chaque bullet point d'expérience commence par un verbe d'action fort
- Quantifie les réalisations quand possible (%, chiffres, durées)
- Adapte le vocabulaire au secteur et au poste ciblé
- Maximum 2 pages équivalent A4
- RÉPONDS UNIQUEMENT EN JSON VALIDE sans aucun formatage Markdown autour`,
        messages: [{
          role: "user",
          content: `Génère le contenu JSON du CV pour ce profil, optimisé pour ce poste.
          
PROFIL : ${JSON.stringify(userProfile, null, 2)}
POSTE CIBLÉ : ${jobDescription}

Structure JSON attendue :
{
  "header": { "name": "", "title": "", "email": "", "phone": "", "location": "", "linkedin": "", "github": "" },
  "summary": "2-3 phrases percutantes",
  "experience": [{ "company": "", "role": "", "period": "", "location": "", "bullets": ["..."] }],
  "education": [{ "institution": "", "degree": "", "field": "", "period": "", "highlights": ["..."] }],
  "skills": { "technical": [], "soft": [], "languages": [], "tools": [] },
  "certifications": [{ "name": "", "issuer": "", "date": "", "credentialId": "" }],
  "projects": [{ "name": "", "description": "", "technologies": [], "url": "" }]
}`,
        }],
      });
      const raw = cvResponse.content[0].type === "text" ? cvResponse.content[0].text : "{}";
      cvContent = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim());
    }

    if (documentType === "cover_letter" || documentType === "both") {
      // Pour la cover letter, on bypass les guards spécifiques pour la beta
      // const clGuard = await guardFeature(user.id, "cover_letter");
      // if (!clGuard.allowed) {
      //   return NextResponse.json(
      //     { error: `La lettre de motivation requiert le plan Pro ou Premium. Plan actuel : ${clGuard.plan}` },
      //     { status: 403 }
      //   );
      // }

      const clResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        system: `Tu es un expert en rédaction de lettres de motivation pour le marché international.
Génère une lettre de motivation professionnelle, personnalisée et convaincante.
RÈGLES :
- Ton professionnel mais humain, jamais générique
- 4 paragraphes : accroche → valeur ajoutée → motivation entreprise → appel à l'action
- Intègre des éléments spécifiques du profil et de l'offre
- Maximum 350 mots
- RÉPONDS UNIQUEMENT EN JSON VALIDE sans formatage Markdown`,
        messages: [{
          role: "user",
          content: `Génère la lettre de motivation en JSON.
          
PROFIL : ${JSON.stringify(userProfile, null, 2)}
OFFRE : ${jobDescription}
SCORE DE MATCH : ${matchScoreResult?.overallScore ?? "N/A"}/100
POINTS FORTS IDENTIFIÉS : ${JSON.stringify(matchScoreResult?.recommendations?.strengths ?? [])}

Structure JSON attendue :
{
  "date": "${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}",
  "sender": { "name": "", "email": "", "phone": "", "location": "" },
  "recipient": { "company": "", "address": "", "contactName": "", "contactTitle": "" },
  "subject": "Objet de la lettre",
  "salutation": "Madame, Monsieur,",
  "paragraphs": ["p1", "p2", "p3", "p4"],
  "closing": "Dans l'attente...",
  "signature": "Prénom NOM"
}`,
        }],
      });
      const raw = clResponse.content[0].type === "text" ? clResponse.content[0].text : "{}";
      coverLetterContent = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim());
    }

    // ── Étape 2 : Construction du .docx ──────────────────────────────────────
    const sections = [];

    if (cvContent) {
      sections.push(buildCVSection(cvContent));
    }

    if (coverLetterContent) {
      sections.push(buildCoverLetterSection(coverLetterContent));
    }

    const doc = new Document({
      creator: "ApplyWise AI",
      title: cvContent ? `CV - ${cvContent.header?.name}` : "Lettre de motivation",
      description: "Document généré par ApplyWise AI",
      numbering: {
        config: [
          {
            reference: "bullets",
            levels: [{
              level: 0,
              format: LevelFormat.BULLET,
              text: "▸",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 360, hanging: 240 },
                  spacing: { after: 40 },
                },
                run: { color: COLORS.secondary, size: 18 },
              },
            }],
          },
        ],
      },
      styles: {
        default: {
          document: { run: { font: "Calibri", size: 20, color: COLORS.text } },
        },
      },
      sections,
    });

    const buffer = await Packer.toBuffer(doc);

    let filename = `Dossier_Candidature.docx`;
    if (documentType === "cv" && cvContent?.header?.name) {
      filename = `CV_${cvContent.header.name.replace(/\s+/g, "_")}.docx`;
    } else if (documentType === "cover_letter" && coverLetterContent?.sender?.name) {
      filename = `LettreMotivation_${coverLetterContent.sender.name.replace(/\s+/g, "_")}.docx`;
    }

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
// CONSTRUCTEURS DE SECTIONS DOCX
// ═══════════════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCVSection(cv: any) {
  const children: Paragraph[] = [];

  // ── EN-TÊTE : Nom + Titre ──────────────────────────────────────────────────
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: (cv.header?.name || 'Nom').toUpperCase(),
          bold: true,
          size: 52,          // 26pt
          color: COLORS.primary,
          font: "Calibri",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: COLORS.secondary, space: 6 } },
      children: [
        new TextRun({
          text: cv.header?.title || 'Titre',
          size: 26,          // 13pt
          color: COLORS.secondary,
          font: "Calibri",
          italics: true,
        }),
      ],
    }),
  );

  // ── COORDONNÉES ────────────────────────────────────────────────────────────
  const contactItems = [
    cv.header?.email,
    cv.header?.phone,
    cv.header?.location,
    cv.header?.linkedin ? `LinkedIn: ${cv.header.linkedin}` : null,
  ].filter(Boolean);

  if (contactItems.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 200 },
        children: contactItems.map((item, i) => [
          new TextRun({ text: item!, size: 18, color: COLORS.textLight }),
          i < contactItems.length - 1
            ? new TextRun({ text: "  •  ", size: 18, color: COLORS.secondary, bold: true })
            : null,
        ]).flat().filter(Boolean) as TextRun[],
      })
    );
  }

  // ── PROFIL RÉSUMÉ ──────────────────────────────────────────────────────────
  if (cv.summary) {
    children.push(
      buildSectionHeader("PROFIL PROFESSIONNEL"),
      new Paragraph({
        spacing: { after: 200 },
        shading: { fill: COLORS.accent, type: ShadingType.CLEAR },
        border: {
          left: { style: BorderStyle.SINGLE, size: 16, color: COLORS.secondary, space: 8 },
        },
        indent: { left: 180 },
        children: [
          new TextRun({ text: cv.summary, size: 20, color: COLORS.text, italics: true }),
        ],
      })
    );
  }

  // ── EXPÉRIENCES ────────────────────────────────────────────────────────────
  if (cv.experience && cv.experience.length > 0) {
    children.push(buildSectionHeader("EXPÉRIENCES PROFESSIONNELLES"));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cv.experience.forEach((exp: any) => {
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 20 },
          children: [
            new TextRun({ text: exp.role || 'Rôle', bold: true, size: 22, color: COLORS.primary }),
            new TextRun({ text: "  |  ", size: 20, color: COLORS.border }),
            new TextRun({ text: exp.company || 'Entreprise', size: 20, color: COLORS.secondary }),
          ],
        }),
        new Paragraph({
          spacing: { before: 0, after: 60 },
          children: [
            new TextRun({ text: exp.period || '', size: 18, color: COLORS.textLight, italics: true }),
            exp.location ? new TextRun({ text: `  —  ${exp.location}`, size: 18, color: COLORS.textLight }) : null,
          ].filter(Boolean) as TextRun[],
        }),
        ...(exp.bullets || []).map((b: string) =>
          new Paragraph({
            numbering: { reference: "bullets", level: 0 },
            spacing: { after: 40 },
            children: [new TextRun({ text: b, size: 19, color: COLORS.text })],
          })
        ),
        spacer(80),
      );
    });
  }

  // ── FORMATION ──────────────────────────────────────────────────────────────
  if (cv.education && cv.education.length > 0) {
    children.push(buildSectionHeader("FORMATION"));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cv.education.forEach((edu: any) => {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 20 },
          children: [
            new TextRun({ text: edu.degree || 'Diplôme', bold: true, size: 22, color: COLORS.primary }),
            new TextRun({ text: ` — ${edu.field || 'Domaine'}`, size: 20, color: COLORS.text }),
          ],
        }),
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: edu.institution || 'École', size: 20, color: COLORS.secondary }),
            new TextRun({ text: `  |  ${edu.period || ''}`, size: 18, color: COLORS.textLight, italics: true }),
          ],
        }),
        ...(edu.highlights || []).map((h: string) =>
          new Paragraph({
            numbering: { reference: "bullets", level: 0 },
            children: [new TextRun({ text: h, size: 18, color: COLORS.textLight })],
          })
        ),
      );
    });
  }

  // ── COMPÉTENCES ────────────────────────────────────────────────────────────
  if (cv.skills) {
    children.push(buildSectionHeader("COMPÉTENCES"));
    const skillGroups = [
      { label: "Techniques", items: cv.skills.technical },
      { label: "Outils", items: cv.skills.tools },
      { label: "Langues", items: cv.skills.languages },
      { label: "Soft Skills", items: cv.skills.soft },
    ].filter(g => g.items && g.items.length > 0);

    skillGroups.forEach(group => {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({ text: `${group.label} : `, bold: true, size: 20, color: COLORS.primary }),
            new TextRun({ text: group.items.join("  ·  "), size: 20, color: COLORS.text }),
          ],
        })
      );
    });
  }

  // ── CERTIFICATIONS ─────────────────────────────────────────────────────────
  if (cv.certifications && cv.certifications.length > 0) {
    children.push(buildSectionHeader("CERTIFICATIONS"));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cv.certifications.forEach((cert: any) => {
      children.push(
        new Paragraph({
          spacing: { before: 60, after: 20 },
          children: [
            new TextRun({ text: cert.name || 'Certif', bold: true, size: 20, color: COLORS.primary }),
            new TextRun({ text: `  —  ${cert.issuer || 'Organisme'}`, size: 19, color: COLORS.textLight }),
            cert.date ? new TextRun({ text: `  (${cert.date})`, size: 18, color: COLORS.textLight, italics: true }) : null,
          ].filter(Boolean) as TextRun[],
        })
      );
    });
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCoverLetterSection(cl: any) {
  const children: Paragraph[] = [];

  // Date
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 0, after: 400 },
      children: [new TextRun({ text: cl.date || '', size: 20, color: COLORS.textLight })],
    })
  );

  // Expéditeur
  children.push(
    new Paragraph({ children: [new TextRun({ text: cl.sender?.name || 'Nom', bold: true, size: 22, color: COLORS.primary })] }),
    new Paragraph({ children: [new TextRun({ text: cl.sender?.email || '', size: 20, color: COLORS.textLight })] }),
    new Paragraph({ children: [new TextRun({ text: cl.sender?.phone || '', size: 20, color: COLORS.textLight })] }),
    new Paragraph({
      spacing: { after: 300 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border, space: 8 } },
      children: [new TextRun({ text: cl.sender?.location || '', size: 20, color: COLORS.textLight })],
    }),
  );

  // Destinataire
  if (cl.recipient?.company) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: cl.recipient.contactName || cl.recipient.company, bold: true, size: 20 })] }),
      new Paragraph({ spacing: { after: 400 }, children: [new TextRun({ text: cl.recipient.company, size: 20, color: COLORS.textLight })] }),
    );
  }

  // Objet
  children.push(
    new Paragraph({
      spacing: { after: 400 },
      children: [
        new TextRun({ text: "Objet : ", bold: true, size: 20, color: COLORS.primary }),
        new TextRun({ text: cl.subject || 'Candidature', size: 20, underline: {} }),
      ],
    })
  );

  // Salutation
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: cl.salutation || 'Madame, Monsieur,', size: 20 })],
    })
  );

  // Corps
  (cl.paragraphs || []).forEach((para: string) => {
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        indent: { firstLine: 720 },
        alignment: AlignmentType.JUSTIFIED,
        children: [new TextRun({ text: para, size: 20, color: COLORS.text })],
      })
    );
  });

  // Formule de politesse + signature
  children.push(
    spacer(200),
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: cl.closing || '', size: 20, italics: true, color: COLORS.textLight })],
    }),
    spacer(600),
    new Paragraph({
      children: [new TextRun({ text: cl.signature || '', bold: true, size: 22, color: COLORS.primary })],
    }),
  );

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

// ── Helpers UI ────────────────────────────────────────────────────────────────

function buildSectionHeader(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.primary, space: 4 } },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 24,
        color: COLORS.primary,
        font: "Calibri",
        allCaps: true,
      }),
    ],
  });
}

function spacer(height: number): Paragraph {
  return new Paragraph({ spacing: { before: 0, after: height }, children: [] });
}
