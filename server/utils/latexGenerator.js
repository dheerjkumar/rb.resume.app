'use strict';
/**
 * latexGenerator.js
 *
 * Builds the Classic ATS .tex file entirely in JavaScript — no Handlebars.
 * This avoids all brace-conflict issues between LaTeX {}{} and Handlebars {{}}.
 *
 * Windows / MiKTeX assumption: `pdflatex` must be on the PATH.
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { exec } = require('child_process');
const axios = require('axios');

// ── LaTeX-escape ─────────────────────────────────────────────────────────────
const LATEX_MAP = {
  '&':  '\\&',
  '%':  '\\%',
  '$':  '\\$',
  '#':  '\\#',
  '_':  '\\_',
  '{':  '\\{',
  '}':  '\\}',
  '~':  '\\textasciitilde{}',
  '^':  '\\textasciicircum{}',
  '\\': '\\textbackslash{}',
};
function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&%$#_{}~^\\]/g, ch => LATEX_MAP[ch] || ch);
}

function decodeEntities(str) {
  if (!str) return '';
  return String(str)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function getIconMacro(url, label) {
  const str = ((url || '') + ' ' + (label || '')).toLowerCase();
  if (str.includes('linkedin')) return '\\faLinkedin';
  if (str.includes('github')) return '\\faGithub';
  if (str.includes('leetcode')) return '\\faCode';
  if (str.includes('geeksforgeeks') || str.includes('gfg')) return '\\faCode';
  if (str.includes('twitter') || str.includes('x.com')) return '\\faTwitter';
  return '\\faLink';
}

function convertHtmlToBullets(html) {
  if (!html || typeof html !== 'string') return [];

  let str = html.trim();
  if (!str) return [];

  const hasLi = /<li[^>]*>/i.test(str);
  let items = [];

  if (hasLi) {
    const matches = str.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi);
    for (const m of matches) {
      items.push(m[1]);
    }
  } else {
    const delimited = str
      .replace(/<\/p>|<\/div>|<br\s*\/?>/gi, '\uE009')
      .split(/\uE009|\n+/);
    
    for (let part of delimited) {
      part = part.replace(/^<p[^>]*>|^<div[^>]*>/gi, '').trim();
      if (part) {
        items.push(part);
      }
    }
  }

  const latexItems = [];
  for (let rawItem of items) {
    let cleaned = rawItem.replace(/^[\s\u2022\u2013\u2014\-*+]+/, '').trim();
    if (!cleaned) continue;

    let s = cleaned
      .replace(/<(strong|b)[^>]*>/gi, '\uE000')
      .replace(/<\/(strong|b)>/gi, '\uE001')
      .replace(/<(em|i)[^>]*>/gi, '\uE002')
      .replace(/<\/(em|i)>/gi, '\uE003')
      .replace(/<a[^>]*>/gi, '')
      .replace(/<\/a>/gi, '')
      .replace(/<[^>]+>/g, '');

    s = decodeEntities(s);
    s = esc(s);

    s = s
      .replace(/\uE000/g, '\\textbf{')
      .replace(/\uE001/g, '}')
      .replace(/\uE002/g, '\\textit{')
      .replace(/\uE003/g, '}');

    s = s.trim();
    if (s) {
      latexItems.push(`        \\resumeItem{${s}}`);
    }
  }

  return latexItems;
}

// ── Image download ─────────────────────────────────────────────────────────────
async function downloadImage(url, destPath) {
  if (!url) return null;
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    fs.writeFileSync(destPath, res.data);
    return destPath;
  } catch (err) {
    console.error('Image download error:', err.message);
    return null;
  }
}

// ── LaTeX document builder ─────────────────────────────────────────────────────
function buildTex(d) {
  const hasLogoOrPhoto = d.logoPath || d.photoPath;
  const leftWidth  = hasLogoOrPhoto ? '0.75' : '1.0';
  const rightWidth = '0.25';

  // ── HEADING ──
  const contactParts = [];
  if (d.phone)    contactParts.push(`\\faPhone\\ ${esc(d.phone)}`);
  if (d.email)    contactParts.push(`\\href{mailto:${d.email}}{\\faEnvelope\\ ${esc(d.email)}}`);
  if (d.location) contactParts.push(`\\faMapMarker*\\ ${esc(d.location)}`);

  const linkParts = d.links.map(l =>
    `\\href{${l.url}}{${getIconMacro(l.url, l.label)}\\ ${esc(l.label)}}`
  );

  let heading = `
\\begin{minipage}[c]{${leftWidth}\\textwidth}
    \\textbf{\\Huge ${esc(d.name)}} \\\\ \\vspace{5pt}
    \\small 
    ${contactParts.join(' ~ $|$ ~ ')} ${contactParts.length && linkParts.length ? '\\\\ \\vspace{2pt}' : ''}
    ${linkParts.join(' ~ $|$ ~ ')}
\\end{minipage}%`;

  if (hasLogoOrPhoto) {
    heading += `
\\begin{minipage}[c]{${rightWidth}\\textwidth}
    \\raggedleft
    ${d.photoPath ? `\\includegraphics[width=${d.photoWidthCm || '1.7cm'},keepaspectratio]{${d.photoPath}}\n` : ''}
    ${d.logoPath  ? `\\includegraphics[width=${d.logoWidthCm  || '1.7cm'},keepaspectratio]{${d.logoPath}}\n` : ''}
\\end{minipage}`;
  }

  heading += `\n\\vspace{-4pt}`;

  // ── EDUCATION ──
  let education = '';
  if (d.education.length) {
    const entries = d.education.map(e => {
      const degreeStr = e.score ? `${esc(e.degree)} (Score: ${esc(e.score)})` : esc(e.degree);
      return `    \\resumeSubheading
      {${esc(e.institution)}}{${esc(e.location)}}
      {${degreeStr}}{${esc(e.duration)}}`;
    }).join('\n');
    education = `\n%-----------EDUCATION-----------\n\\section{Education}\n  \\resumeSubHeadingListStart\n${entries}\n  \\resumeSubHeadingListEnd\n`;
  }

  // ── EXPERIENCE ──
  let experience = '';
  if (d.experience.length) {
    const entries = d.experience.map(e => {
      const roleStr = e.link
        ? `${esc(e.role)} $|$ \\href{${e.link}}{\\textbf{\\emph{${esc(e.linkLabel || 'Link')}}}}`
        : esc(e.role);
      const bulletItems = convertHtmlToBullets(e.descriptionHtml);
      const bulletBlock = bulletItems.length
        ? `\n      \\resumeItemListStart\n${bulletItems.join('\n')}\n      \\resumeItemListEnd`
        : '';
      return `    \\resumeSubheading
      {${esc(e.company)}}{${esc(e.location)}}
      {${roleStr}}{${esc(e.duration)}}${bulletBlock}`;
    }).join('\n');
    experience = `\n%-----------EXPERIENCE-----------\n\\section{Experience}\n  \\resumeSubHeadingListStart\n${entries}\n  \\resumeSubHeadingListEnd\n`;
  }

  // ── PROJECTS ──
  let projects = '';
  if (d.projects.length) {
    const entries = d.projects.map(p => {
      const titleStr = p.link
        ? `\\textbf{${esc(p.title)}} $|$ \\href{${p.link}}{\\textbf{\\emph{${esc(p.linkLabel || 'Link')}}}}`
        : `\\textbf{${esc(p.title)}}`;
      const techStr = p.technologies ? ` \\\\ \\small\\emph{${esc(p.technologies)}}` : '';
      const bulletItems = convertHtmlToBullets(p.descriptionHtml);
      const bulletBlock = bulletItems.length
        ? `\n      \\resumeItemListStart\n${bulletItems.join('\n')}\n      \\resumeItemListEnd`
        : '';
      return `    \\resumeProjectHeading
      {${titleStr}${techStr}}{${esc(p.duration)}}${bulletBlock}`;
    }).join('\n');
    projects = `\n%-----------PROJECTS-----------\n\\section{Projects}\n  \\resumeSubHeadingListStart\n${entries}\n  \\resumeSubHeadingListEnd\n`;
  }

  // ── SKILLS ──
  let skills = '';
  if (d.skills.length) {
    const rows = d.skills.map((s, idx) =>
      `     \\textbf{${esc(s.category)}}{: ${esc(s.items)}}${idx < d.skills.length - 1 ? ' \\\\' : ''}`
    ).join('\n');
    skills = `\n%-----------SKILLS-----------\n\\section{Technical Skills}\n \\begin{itemize}[leftmargin=0.15in, label={}]\n    \\small{\\item{\n${rows}\n    }}\n \\end{itemize}\n`;
  }

  // ── ACHIEVEMENTS ──
  let achievements = '';
  if (d.achievements.length) {
    const entries = d.achievements.map(a => `    \\resumeSubheading
      {${esc(a.title)}}{${esc(a.organization)}}
      {${esc(a.description)}}{${esc(a.date)}}`).join('\n');
    achievements = `\n%-----------HONORS & AWARDS-----------\n\\section{Honors and Awards}\n  \\resumeSubHeadingListStart\n${entries}\n  \\resumeSubHeadingListEnd\n`;
  }

  // ── HOBBIES ──
  let hobbies = '';
  if (d.hobbies.length) {
    const rows = d.hobbies.map((h, idx) =>
      `      \\textbf{${esc(h.name)}}${h.role ? ` $|$ \\emph{${esc(h.role)}}` : ''}${idx < d.hobbies.length - 1 ? ' \\\\' : ''}`
    ).join('\n');
    hobbies = `\n%-----------EXTRACURRICULAR-----------\n\\section{Extracurricular Activities}\n  \\resumeSubHeadingListStart\n    \\small{\\item{\n${rows}\n    }}\n  \\resumeSubHeadingListEnd\n`;
  }

  return `%------------------------
% Resume Builder Platform — Classic ATS Template
%------------------------

\\documentclass[a4paper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[pdftex]{hyperref}
\\usepackage{fancyhdr}
\\usepackage{graphicx}
\\usepackage{fontawesome5}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1.0in}
\\addtolength{\\topmargin}{-0.6in}
\\addtolength{\\textheight}{1.2in}

\\urlstyle{rm}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large\\bfseries
}{}{0em}{}[\\color{black}\\hrule height 0.5pt \\vspace{-4pt}]

\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-1pt}\\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{#3} & \\textit{#4} \\\\
    \\end{tabular*}\\vspace{-5pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\vspace{-1pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\begin{tabular}[t]{@{}l@{}}#1\\end{tabular} & \\textit{#2} \\\\
    \\end{tabular*}\\vspace{-5pt}
}

\\newcommand{\\resumeSingleSubheading}[2]{
    \\vspace{-1pt}\\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      #1 & \\textit{#2} \\\\
    \\end{tabular*}\\vspace{-5pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}
${heading}
${education}${experience}${projects}${skills}${achievements}${hobbies}
\\end{document}
`;
}

// ── Main export ────────────────────────────────────────────────────────────────
async function generateLatexPdf(resume, institute) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rb-latex-'));

  try {
    // Download remote images to temp local files
    let photoLocalPath = null;
    let logoLocalPath  = null;

    const forceJpg = (url) => {
      if (!url) return url;
      if (url.includes('res.cloudinary.com')) {
        return url.replace(/\.[a-zA-Z0-9]+(\?.*)?$/, '.jpg$1');
      }
      return url;
    };

    if (resume.personalDetails?.photoUrl) {
      const dest = path.join(tmpDir, 'photo.jpg');
      photoLocalPath = await downloadImage(forceJpg(resume.personalDetails.photoUrl), dest);
    }
    if (institute?.logoUrl) {
      const dest = path.join(tmpDir, 'logo.jpg');
      logoLocalPath = await downloadImage(forceJpg(institute.logoUrl), dest);
    }

    const pd    = resume.personalDetails || {};
    const links = (resume.hyperlinks || []).slice(0, 4);

    const logoSizePx  = resume.layoutConfig?.typography?.logoSize  || 64;
    const photoSizePx = resume.layoutConfig?.typography?.photoSize || 64;

    const logoWidthCm  = (logoSizePx  * 0.0265).toFixed(2) + 'cm';
    const photoWidthCm = (photoSizePx * 0.0265).toFixed(2) + 'cm';

    const data = {
      name:         pd.name     || 'Your Name',
      phone:        pd.phone    || '',
      email:        pd.email    || '',
      location:     pd.location || '',
      photoPath:    photoLocalPath ? photoLocalPath.replace(/\\/g, '/') : null,
      logoPath:     logoLocalPath  ? logoLocalPath.replace(/\\/g, '/')  : null,
      logoWidthCm,
      photoWidthCm,

      links: links.map(l => ({ url: l.url || '', label: l.label || l.url || '' })),

      education: (resume.education || []).map(e => ({
        institution: e.institution || '',
        location:    e.location    || '',
        degree:      e.degree      || '',
        duration:    e.duration    || '',
        score:       e.score       || '',
      })),

      experience: (resume.experience || []).map(e => ({
        company:         e.company  || '',
        location:        e.location || '',
        role:            e.role     || '',
        duration:        e.duration || '',
        link:            e.link     || '',
        linkLabel:       e.linkLabel || 'Link',
        descriptionHtml: e.description || '',
      })),

      projects: (resume.projects || []).map(p => ({
        title:           p.title       || '',
        technologies:    p.technologies|| '',
        duration:        p.duration    || '',
        link:            p.link        || '',
        linkLabel:       p.linkLabel   || 'Link',
        descriptionHtml: p.description || '',
      })),

      skills: (resume.skills || []).map(s => ({
        category: s.category || '',
        items:    s.items    || '',
      })),

      achievements: (resume.achievements || []).map(a => ({
        title:        a.title        || '',
        organization: a.organization || '',
        description:  a.description  || '',
        date:         a.date         || '',
      })),

      hobbies: (resume.hobbies || []).map(h => ({
        name: h.name || '',
        role: h.role || '',
      })),
    };

    const texContent = buildTex(data);
    const texFile    = path.join(tmpDir, 'resume.tex');
    fs.writeFileSync(texFile, texContent, 'utf8');

    // Also dump to debug file location for inspection
    try {
      const debugPath = path.join(__dirname, '../debug_generated.tex');
      fs.writeFileSync(debugPath, texContent, 'utf8');
      console.log('Saved debug tex to:', debugPath);
    } catch(e) {}

    // Force MiKTeX to auto-install missing packages silently without GUI prompts
    try {
      await runCmd('initexmf', ['--set-config-value=[Core]AutoInstall=1'], tmpDir);
    } catch(e) {}

    // Run pdflatex twice (second pass resolves hyperlinks)
    const args = ['-interaction=nonstopmode', 'resume.tex'];
    await runCmd('pdflatex', args, tmpDir);
    await runCmd('pdflatex', args, tmpDir);

    const pdfPath = path.join(tmpDir, 'resume.pdf');
    if (!fs.existsSync(pdfPath)) {
      const logFile = path.join(tmpDir, 'resume.log');
      const log = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8').slice(-2000) : '(no log)';
      const cmdOutFile = path.join(tmpDir, 'cmd_output.txt');
      const cmdOut = fs.existsSync(cmdOutFile) ? fs.readFileSync(cmdOutFile, 'utf8').slice(-2000) : '(no cmd out)';
      throw new Error(`pdflatex produced no PDF.\n\nCMD OUT:\n${cmdOut}\n\nLOG:\n${log}`);
    }

    return pdfPath;

  } catch (err) {
    cleanup(tmpDir);
    throw err;
  }
}

function runCmd(cmd, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process');
    const env = Object.assign({}, process.env);
    const miktexPaths = [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'MiKTeX', 'miktex', 'bin', 'x64'),
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'MiKTeX 2.9', 'miktex', 'bin', 'x64'),
      'C:\\Program Files\\MiKTeX\\miktex\\bin\\x64',
      'C:\\Program Files\\MiKTeX 2.9\\miktex\\bin\\x64',
      'C:\\texlive\\2023\\bin\\windows',
      'C:\\texlive\\2024\\bin\\windows'
    ];
    env.PATH = env.PATH + ';' + miktexPaths.join(';');

    const child = spawn(cmd, args, { env, cwd, stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', data => {
      stdout += data.toString();
      console.log(`[pdflatex] ${data.toString().trim()}`);
    });

    child.stderr.on('data', data => {
      stderr += data.toString();
      console.error(`[pdflatex stderr] ${data.toString().trim()}`);
    });

    child.on('error', err => {
      console.error(`[pdflatex process error]`, err);
      if (err.code === 'ENOENT') {
        reject(new Error(`pdflatex (or miktex) is not installed or not in PATH. ENOENT error. Please check your LaTeX installation.`));
      } else {
        reject(err);
      }
    });

    child.on('close', code => {
      const out = `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}\n\nEXIT CODE: ${code}`;
      try { fs.writeFileSync(path.join(cwd, 'cmd_output.txt'), out, {flag: 'a'}); } catch(e){}
      resolve(stdout); // We resolve here because exit code 1 is common in LaTeX warnings, we verify via PDF existence later
    });
  });
}

function cleanup(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /**/ }
}

module.exports = { generateLatexPdf, cleanup };
