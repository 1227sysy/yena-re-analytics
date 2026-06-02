# YENA RE Analytics
**AI 기반 부동산 분양·상담 데이터 대시보드**

> 분양대행사, 시행사, 부동산 마케팅 회사에서 실제로 사용할 수 있는 고급 SaaS형 Google Sheets 연동 대시보드

---

## 📊 STEP 0 — 컬럼 매핑 결과

**분석 대상**: `1zVrJhs_0sB3wSP-vpV23usjBfS7zfPeBi8oTx_jZ9qw` → `Rawdata` 탭

| 인덱스 | 헤더 | 추론 타입 | 역할 | 비고 |
|--------|------|----------|------|------|
| 0 | `no` | numeric | 수강생번호 | 순번 |
| 1 | `이름` | text | 수강생명 | 17명 등록 |
| 2 | `이메일` | email | 이메일 | 16명 등록, 1명 미등록 |
| 3 | `1일차 URL` | url (day=1) | 과제URL | Vercel 배포 링크 |
| 4 | `2일차 URL` | url (day=2) | 과제URL | 일부만 제출 |
| 5 | `3일차 URL` | url (day=3) | 과제URL | 일부만 제출 |

**데이터셋 유형**: `education-tracking` — KREMA AI 심화 교육 수강생 진도 관리  
**총 수강생**: 17명 (활성 데이터 기준)

---

## 🚀 로컬 실행 방법

```bash
cd yena-re-analytics
npm install
# .env.local 설정 후:
npm run dev
# → http://localhost:3000
```

---

## ⚙️ 환경변수 설정

`.env.local` 파일에 아래 값을 설정합니다.

```env
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key_id":"..."}
GOOGLE_SHEETS_ID=1zVrJhs_0sB3wSP-vpV23usjBfS7zfPeBi8oTx_jZ9qw
GOOGLE_SHEET_TAB=Rawdata
GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxx
ALLOWED_HOSTED_DOMAINS=gmail.com,yourcompany.com
NEXTAUTH_SECRET=랜덤문자열32자이상openssl_rand_-base64_32
NEXTAUTH_URL=http://localhost:3000
```

---

## 1️⃣ Google Cloud 서비스 계정 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 (또는 새 프로젝트 생성)
3. **API 및 서비스** → **라이브러리** → `Google Sheets API` 활성화
4. **IAM 및 관리** → **서비스 계정** → **서비스 계정 만들기**
5. 이름 입력 → **완료**
6. 생성된 계정 클릭 → **키** 탭 → **키 추가** → **새 키 만들기** → **JSON**
7. 다운로드된 JSON 파일을 한 줄로 압축:
   ```bash
   # Mac/Linux
   cat service-account-key.json | tr -d '\n'
   
   # Windows PowerShell
   (Get-Content service-account-key.json -Raw) -replace '\s+','' | Set-Clipboard
   ```
8. 압축된 문자열을 `GOOGLE_SERVICE_ACCOUNT_JSON=` 뒤에 붙여넣기

---

## 2️⃣ Google Sheets 공유 권한 설정

1. 서비스 계정 이메일 복사 (예: `dashboard@project.iam.gserviceaccount.com`)
2. 대상 스프레드시트 열기
3. 우상단 **공유** 버튼 클릭
4. 서비스 계정 이메일 입력 → 권한: **뷰어** → 전송
5. ✅ "사용자에게 알림" 체크 해제 (이메일 발송 불필요)

---

## 3️⃣ Google OAuth 웹 클라이언트 설정

1. Google Cloud Console → **API 및 서비스** → **사용자 인증 정보**
2. **+ 사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**
3. 애플리케이션 유형: **웹 애플리케이션**
4. 승인된 리디렉션 URI 추가:
   - 로컬: `http://localhost:3000/api/auth/callback/google`
   - 프로덕션: `https://your-domain.vercel.app/api/auth/callback/google`
5. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 복사

---

## 4️⃣ NEXTAUTH_SECRET 생성

```bash
# Mac/Linux
openssl rand -base64 32

# Windows PowerShell
[System.Web.Security.Membership]::GeneratePassword(32, 4)
# 또는 그냥 임의 문자열 32자 이상 입력
```

---

## ☁️ Vercel 배포 방법

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 또는 GitHub 연동 후 자동 배포
```

### Vercel 환경변수 등록

1. [Vercel 대시보드](https://vercel.com) → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 아래 변수 모두 등록:

| 변수명 | 비고 |
|--------|------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | JSON 한 줄 문자열 |
| `GOOGLE_SHEETS_ID` | 시트 ID |
| `GOOGLE_SHEET_TAB` | 탭 이름 |
| `GOOGLE_CLIENT_ID` | OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | OAuth 클라이언트 시크릿 |
| `ALLOWED_HOSTED_DOMAINS` | 허용 이메일 도메인 |
| `NEXTAUTH_SECRET` | 32자 이상 무작위 문자열 |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |

4. Vercel 대시보드에서 **Redeploy**

---

## ❓ 자주 발생하는 오류 해결법

### `GOOGLE_SERVICE_ACCOUNT_JSON이 설정되지 않았습니다`
→ `.env.local`에 서비스 계정 JSON을 한 줄로 압축해서 붙여넣으세요.

### `The caller does not have permission`
→ 서비스 계정 이메일을 Google Sheets에 **뷰어**로 공유했는지 확인.

### `AccessDenied` (로그인 후 접근 불가)
→ `ALLOWED_HOSTED_DOMAINS`에 본인 이메일 도메인 추가 또는 비워두면 모든 Google 계정 허용.

### `redirect_uri_mismatch`
→ Cloud Console OAuth 설정에서 현재 도메인의 `/api/auth/callback/google` 추가.

### `Invalid JSON`
→ `GOOGLE_SERVICE_ACCOUNT_JSON` 값에 줄바꿈이 있는 경우. `tr -d '\n'`으로 제거 후 재설정.

### TypeScript 빌드 오류
```bash
npx tsc --noEmit   # 오류 확인
npm run build      # 빌드 테스트
```

---

## 🏗️ 기술 스택

| 항목 | 버전 |
|------|------|
| Next.js | ^15.0.4 |
| React | ^19.0.0 |
| NextAuth | 5.0.0-beta.25 |
| googleapis | ^144.0.0 |
| 배포 | Vercel |

---

*Powered by Claude + Google Workspace · YENA RE Analytics © 2026*
