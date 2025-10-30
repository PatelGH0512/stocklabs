# server.py
import os
import json
import logging
from typing import List, Dict, Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

import yfinance as yf

# Agno + Gemini
from agno.agent import Agent
from agno.models.google import Gemini

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# ----------------------------
# Data utilities (no Streamlit)
# ----------------------------

def get_stock_price(symbol: str) -> dict:
    try:
        stock = yf.Ticker(symbol)
        info = stock.info
        hist = stock.history(period="1d")
        if hist.empty:
            return {"error": f"Could not retrieve data for {symbol}"}
        current_price = hist['Close'].iloc[-1]
        return {
            "symbol": symbol,
            "current_price": round(float(current_price), 2),
            "company_name": info.get('longName', symbol),
            "market_cap": info.get('marketCap', 0),
            "pe_ratio": info.get('trailingPE', 'N/A'),
            "52_week_high": info.get('fiftyTwoWeekHigh', 0),
            "52_week_low": info.get('fiftyTwoWeekLow', 0)
        }
    except Exception as e:
        return {"error": str(e)}

def get_financial_statements(symbol: str) -> dict:
    try:
        stock = yf.Ticker(symbol)
        financials = stock.financials
        balance_sheet = stock.balance_sheet
        if financials is None or financials.empty:
            return {"error": f"No financials for {symbol}"}
        latest_year = financials.columns[0]
        return {
            "symbol": symbol,
            "period": str(getattr(latest_year, 'year', latest_year)),
            "revenue": float(financials.loc['Total Revenue', latest_year]) if 'Total Revenue' in financials.index else 'N/A',
            "net_income": float(financials.loc['Net Income', latest_year]) if 'Net Income' in financials.index else 'N/A',
            "total_assets": float(balance_sheet.loc['Total Assets', latest_year]) if 'Total Assets' in balance_sheet.index else 'N/A',
            "total_debt": float(balance_sheet.loc['Total Debt', latest_year]) if 'Total Debt' in balance_sheet.index else 'N/A'
        }
    except Exception as e:
        return {"error": str(e)}

def get_technical_indicators(symbol: str, period: str = "6mo") -> dict:
    try:
        stock = yf.Ticker(symbol)
        hist = stock.history(period=period)
        if hist.empty:
            return {"error": f"No historical data for {symbol}"}
        hist['SMA_20'] = hist['Close'].rolling(window=20).mean()
        hist['SMA_50'] = hist['Close'].rolling(window=50).mean()
        delta = hist['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / (loss.replace(0, 1))  # avoid div by zero
        rsi = 100 - (100 / (1 + rs))
        latest = hist.iloc[-1]
        latest_rsi = rsi.iloc[-1]
        return {
            "symbol": symbol,
            "current_price": round(float(latest['Close']), 2),
            "sma_20": round(float(latest['SMA_20']), 2) if hasattr(latest['SMA_20'], "__float__") else None,
            "sma_50": round(float(latest['SMA_50']), 2) if hasattr(latest['SMA_50'], "__float__") else None,
            "rsi": round(float(latest_rsi), 2) if latest_rsi == latest_rsi else None,
            "volume": int(latest['Volume']) if 'Volume' in latest else None,
            "trend_signal": "bullish" if (latest.get('SMA_20') and latest.get('SMA_50') and latest['Close'] > latest['SMA_20'] > latest['SMA_50']) else "bearish"
        }
    except Exception as e:
        return {"error": str(e)}

def compare_stocks(symbols: List[str]) -> Dict[str, float]:
    data: Dict[str, float] = {}
    for symbol in symbols:
        try:
            stock = yf.Ticker(symbol)
            hist = stock.history(period="6mo")
            if hist.empty:
                continue
            # approximate cumulative return over period (more robust than sum of pct_change)
            pct = (hist['Close'].iloc[-1] / hist['Close'].iloc[0]) - 1.0
            data[symbol] = float(pct)
        except Exception:
            continue
    return data

# ----------------------------
# Agno/Gemini agents
# ----------------------------

fundamental_analyst_agent = Agent(
    model=Gemini(id="gemini-2.5-flash"),
    description="Performs fundamental analysis using financial statements and valuation ratios.",
    instructions=[
        "Analyze revenue, net income, assets, and debt.",
        "Comment on profitability trends and balance sheet strength.",
        "If data is missing, note assumptions clearly.",
        "Output concise paragraphs with bullet key points and a 1-10 fundamental score."
    ],
)

technical_analyst_agent = Agent(
    model=Gemini(id="gemini-2.5-flash"),
    description="Analyzes technical indicators like SMA and RSI for momentum and trend.",
    instructions=[
        "Interpret SMA(20), SMA(50), RSI(14), and volume to infer trend and momentum.",
        "Flag overbought/oversold zones and crossover signals.",
        "Output key signals and a 1-10 technical score."
    ],
)

risk_analyst_agent = Agent(
    model=Gemini(id="gemini-2.5-flash"),
    description="Evaluates idiosyncratic, sector, market, and regulatory risks.",
    instructions=[
        "Assess leverage, cyclicality, competitive pressure, and macro sensitivity.",
        "Identify top 3 risks and potential mitigants.",
        "Output a 1-10 risk score (lower is riskier)."
    ],
)

market_analyst = Agent(model=Gemini(id="gemini-2.5-flash"), description="Analyzes and compares stock performance.")
company_researcher = Agent(model=Gemini(id="gemini-2.5-flash"), description="Fetches company profiles and news.")
stock_strategist = Agent(model=Gemini(id="gemini-2.5-flash"), description="Provides investment insights.")
team_lead = Agent(model=Gemini(id="gemini-2.5-flash"), description="Aggregates all insights into a final report.")

def generate_gemini_investment_report(symbols: List[str]) -> str:
    per_symbol: Dict[str, Dict[str, Any]] = {}
    for s in symbols:
        price_info = get_stock_price(s)
        fin = get_financial_statements(s)
        tech = get_technical_indicators(s, period="6mo")
        per_symbol[s] = {
            "price": price_info,
            "financials": fin,
            "technical": tech,
        }

    fundamentals_out: Dict[str, str] = {}
    technicals_out: Dict[str, str] = {}
    risks_out: Dict[str, str] = {}
    for s in symbols:
        fin_json = json.dumps(per_symbol[s]["financials"], indent=2)
        tech_json = json.dumps(per_symbol[s]["technical"], indent=2)
        price_json = json.dumps(per_symbol[s]["price"], indent=2)

        f_prompt = (
            f"Fundamental analysis for {s}. Data:\n"
            f"Price: {price_json}\nFinancials: {fin_json}\n"
            f"Deliver: bullet key points, valuation view if possible, and a 1-10 fundamental score."
        )
        t_prompt = (
            f"Technical analysis for {s}. Indicators: {tech_json}.\n"
            f"Interpret RSI(14), SMA(20), SMA(50), volume; produce signals and a 1-10 technical score."
        )
        r_prompt = (
            f"Risk analysis for {s}. Context: Price {price_json}, Financials {fin_json}.\n"
            f"List top 3 risks, mitigants, and a 1-10 risk score (lower is riskier)."
        )

        fundamentals_out[s] = fundamental_analyst_agent.run(f_prompt).content
        technicals_out[s] = technical_analyst_agent.run(t_prompt).content
        risks_out[s] = risk_analyst_agent.run(r_prompt).content

    market_perf = compare_stocks(symbols)
    market_view = market_analyst.run(f"Compare stock performance (6M total return): {market_perf}").content

    coordinator_prompt = (
        "You are the investment coordinator. Combine the following per-symbol analyses "
        "(fundamental, technical, risk) with market context to produce a final investor-friendly report.\n"
        f"Market: {json.dumps(market_perf)}\nMarket View: {market_view}\n\n"
        f"Fundamentals: {json.dumps(fundamentals_out)}\n\n"
        f"Technicals: {json.dumps(technicals_out)}\n\n"
        f"Risks: {json.dumps(risks_out)}\n\n"
        "Output:\n"
        "- Summary of market context\n"
        "- Per-symbol section with scores (fundamental, technical, risk) and key bullets\n"
        "- Overall Buy/Hold/Sell with target range if possible\n"
        "- Ranked list of symbols with short rationale\n"
    )
    final = team_lead.run(coordinator_prompt).content
    return final

# ----------------------------
# FastAPI app
# ----------------------------

class CompareRequest(BaseModel):
    symbols: List[str]

app = FastAPI()

@app.post("/compare")
def compare(req: CompareRequest):
    if not req.symbols:
        raise HTTPException(status_code=400, detail="symbols array is required")

    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY is not configured")

    try:
        report = generate_gemini_investment_report(req.symbols)
        return {"report": report}
    except Exception as e:
        logging.exception("Analysis failed")
        raise HTTPException(status_code=500, detail=str(e))