import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Gemini client initialization
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI Monthly Task Summarization Endpoint
app.post('/api/ai/summarize-monthly', async (req, res) => {
  try {
    const { taskTitle, category, weeklyEntries, monthLabel } = req.body;

    if (!taskTitle || !weeklyEntries || !Array.isArray(weeklyEntries)) {
      return res.status(400).json({ error: '필수 데이터가 누락되었습니다.' });
    }

    const weeklyRecordsText = weeklyEntries
      .map(
        (entry: any, index: number) =>
          `[${entry.weekLabel || `${index + 1}주차`}]\n- 실적: ${entry.work || '(내용 없음)'}\n- 계획: ${entry.plan || '(내용 없음)'}\n- 이슈/요청: ${entry.issues || '(없음)'}\n- 진척률: ${entry.progress || 0}%`
      )
      .join('\n\n');

    if (!ai || !apiKey) {
      // Clean fallback if API key is not configured
      const fallbackSummary = weeklyEntries
        .filter((e: any) => e.work && e.work.trim())
        .map((e: any) => {
          const lines = e.work.split('\n').filter((l: string) => l.trim());
          return lines.map((l: string) => (l.startsWith('-') ? l : `- ${l}`)).join('\n');
        })
        .join('\n')
        .split('\n')
        .filter((l: string, i: number, arr: string[]) => arr.indexOf(l) === i && l.trim())
        .slice(0, 4)
        .join('\n');

      return res.json({
        summary: fallbackSummary || `- ${monthLabel || '해당 월'} 주요 마일스톤 정상 진행 완료\n- 단계별 세부 기능 구현 및 검증 완료`,
        source: 'local-fallback',
      });
    }

    const systemInstruction = `당신은 대기업 경영진 및 부서장에게 보고하는 최고 수준의 전략기획/사업관리 보고서 작성 전문가입니다.
주간 실적 데이터들을 취합하여, 해당 과제의 '${monthLabel || '당월'}' 최종 월간 실적 요약을 3~5줄의 개조식('- '으로 시작)으로 정갈하게 요약하십시오.

작성 원칙:
1. 문장은 반드시 '- ' 기호로 시작하고, 3~5줄 내외로 작성할 것.
2. 비즈니스 보고서 전형적인 명사형 종결어미 사용 (~구축 완료, ~개선 추진, ~적용, ~확보, ~도출).
3. 단순 나열이 아닌 성과와 핵심 액션 위주로 압축 요약.
4. 불필요한 서두나 사족(예: '요약은 다음과 같습니다:') 없이 본문 불릿 목록만 즉시 반환할 것.`;

    const userPrompt = `과제명: ${taskTitle} (카테고리: ${category || '일반'})\n기준 월: ${monthLabel || '당월'}\n\n[주차별 주간 실적 데이터]\n${weeklyRecordsText}\n\n위 주간 실적들을 바탕으로 3~5줄의 명확한 월간 실적 요약을 작성해주세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    const text = response.text ? response.text.trim() : '';

    return res.json({
      summary: text,
      source: 'gemini',
    });
  } catch (error: any) {
    console.error('Gemini summarization error:', error);
    return res.status(500).json({
      error: 'AI 요약 생성 중 오류가 발생했습니다.',
      details: error.message,
    });
  }
});

// AI Executive Monthly Overview Endpoint
app.post('/api/ai/summarize-overview', async (req, res) => {
  try {
    const { monthLabel, stats, tasksSummary } = req.body;

    if (!ai || !apiKey) {
      return res.json({
        overview: `- ${monthLabel} 전체 ${stats?.total || 0}개 과제 중 완료 ${stats?.completed || 0}건, 정상 진행 ${stats?.normal || 0}건으로 목표 일정 준수\n- 지연 과제(${stats?.delayed || 0}건) 대상 리소스 집중 투입 및 일정 만회 방안 수립\n- 차월 핵심 목표 연계 과제 사전 준비 및 부서간 협업 체계 강화`,
        source: 'local-fallback',
      });
    }

    const systemInstruction = `당신은 임원 보고용 업무보고서의 '월간 총평(Executive Summary)'을 작성하는 전문 수석 분석가입니다.
팀의 월간 실적 통계와 과제별 성과를 바탕으로 경영진이 1분 안에 상황을 파악할 수 있도록 3~4개의 명료한 핵심 성과/이슈 총평을 개조식('- ')으로 작성하십시오.`;

    const prompt = `기준 월: ${monthLabel}\n과제 현황: 총 ${stats?.total}건 (완료: ${stats?.completed}건, 정상: ${stats?.normal}건, 지연: ${stats?.delayed}건, 보류: ${stats?.hold}건)\n평균 진척도: ${stats?.avgProgress}%\n\n[주요 과제 요약]\n${tasksSummary}\n\n경영진을 위한 월간 종합 총평 3~4줄을 작성해주세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    return res.json({
      overview: response.text ? response.text.trim() : '',
      source: 'gemini',
    });
  } catch (error: any) {
    console.error('AI Overview error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);

    // Fallback SPA routing in dev mode
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        if (vite.ssrFixStacktrace) {
          vite.ssrFixStacktrace(e);
        }
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Bind to 0.0.0.0 and PORT (defaults to 3000)
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
