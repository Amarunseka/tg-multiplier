import { startGameWithSession, choose, expire, next } from "./gameMachine";
import type { GameState, GameCtx } from "./gameMachine";
import type { SessionConfig } from "./types";
import { uuid } from "../shared/utils/uuid";

export class GameController {
  public state: GameState;
  private ctx: GameCtx;
  public prevAchieved: number;
  public finishRequestId: string;

  constructor(cfg: SessionConfig, sessionId: string, prevAchieved: number) {
    const started = startGameWithSession(cfg, sessionId);
    this.state = started.state;
    this.ctx = started.ctx;
    this.prevAchieved = prevAchieved;
    this.finishRequestId = uuid();
  }

  get sessionId() {
    return this.ctx.sessionId;
  }

  get events() {
    return this.ctx.events;
  }

  choose(value: number) {
    this.state = choose(this.state, this.ctx, value);
    return this.state;
  }

  expire() {
    this.state = expire(this.state, this.ctx);
    return this.state;
  }

  next() {
    this.state = next(this.state, this.ctx);
    return this.state;
  }
}
