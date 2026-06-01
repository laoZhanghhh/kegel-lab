
export enum GameState {
  MENU = 'MENU',
  STARTING = 'STARTING',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED'
}

export interface GameStats {
  hits: number;
  misses: number;
  totalShots: number;
  accuracy: number;
  timeRemaining: number;
  startTime: number;
}
