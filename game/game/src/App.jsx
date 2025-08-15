import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import bridge from '@vkontakte/vk-bridge';
import { Button, Group, Header, Panel, PanelHeader, SimpleCell, Spacing, Switch } from '@vkontakte/vkui';
import { Icon28RefreshOutline, Icon28StatisticsOutline } from '@vkontakte/icons';
import { BOARD_SIZE, addRandomTile, canMove, has2048, move, newGame } from './game/engine.js';

const BEST_KEY = 'vk2048_best_score';

// Эмодзи по значениям
const emojiMap = {
  2: '🌱', 4: '🌿', 8: '🔥', 16: '⚡️', 32: '💎', 64: '🌟',
  128: '🎯', 256: '🚀', 512: '🧠', 1024: '👑', 2048: '🏆',
};

function useBestScore() {
  const [best, setBest] = useState(() => {
    const v = localStorage.getItem(BEST_KEY);
    return v ? Number(v) : 0;
  });
  const updateBest = useCallback((score) => {
    setBest((prev) => {
      const next = Math.max(prev, score);
      localStorage.setItem(BEST_KEY, String(next));
      return next;
    });
  }, []);
  const resetBest = useCallback(() => {
    localStorage.removeItem(BEST_KEY);
    setBest(0);
  }, []);
  return { best, updateBest, resetBest };
}

export default function App() {
  const [{ board, score }, setState] = useState(() => newGame());
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const [showEmoji, setShowEmoji] = useState(true);
  const { best, updateBest, resetBest } = useBestScore();

  const startNew = useCallback(() => {
    const ng = newGame();
    setState(ng);
    setOver(false);
    setWon(false);
    bridge.send('VKWebAppTapticImpactOccurred', { style: 'light' }).catch(() => {});
  }, []);

  const applyMove = useCallback(
    (dir) => {
      if (over) return;
      const res = move(board, dir);
      if (!res.moved) return;

      let nextBoard = addRandomTile(res.board);
      const nextScore = score + res.gained;
      const nextWon = !won && has2048(nextBoard);
      const nextOver = !canMove(nextBoard);

      setState({ board: nextBoard, score: nextScore });
      if (nextWon) {
        setWon(true);
        bridge.send('VKWebAppTapticNotificationOccurred', { type: 'success' }).catch(() => {});
      }
      if (nextOver) {
        setOver(true);
        bridge.send('VKWebAppTapticNotificationOccurred', { type: 'error' }).catch(() => {});
      }
      updateBest(nextScore);

      bridge.send('VKWebAppTapticImpactOccurred', { style: res.gained > 0 ? 'medium' : 'light' }).catch(() => {});
    },
    [board, score, over, won, updateBest]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') applyMove('left');
      else if (e.key === 'ArrowRight') applyMove('right');
      else if (e.key === 'ArrowUp') applyMove('up');
      else if (e.key === 'ArrowDown') applyMove('down');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [applyMove]);

  // Свайпы
  const touchStart = useRef(null);
  const onTouchStart = (e) => {
    const t = e.changedTouches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const threshold = 24;
    if (Math.max(absX, absY) < threshold) return;
    if (absX > absY) applyMove(dx > 0 ? 'right' : 'left');
    else applyMove(dy > 0 ? 'down' : 'up');
    touchStart.current = null;
  };

  const tiles = useMemo(() => {
    const list = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const v = board[r][c];
        if (v > 0) list.push({ key: `${r}-${c}-${v}`, r, c, value: v });
      }
    }
    return list;
  }, [board]);

  return (
    <Panel id="main">
      <PanelHeader>2048</PanelHeader>

      <Group header={<Header mode="secondary">Счет</Header>}>
        <div className="score-bar">
          <div className="score-card">
            <span className="label">Текущий</span>
            <span className="value">{score}</span>
          </div>
          <div className="score-card">
            <span className="label">Рекорд</span>
            <span className="value">{best}</span>
          </div>
          <div className="actions">
            <div className="switch-with-text">
              <Switch
                checked={showEmoji}
                onChange={(e) => setShowEmoji(e.target.checked)}
                aria-label="Эмодзи"
              />
              <span className="switch-text">Эмодзи</span>
            </div>
            <Button
              size="m"
              appearance="accent"
              mode="secondary"
              before={<Icon28RefreshOutline />}
              onClick={startNew}
            >
              Новая игра
            </Button>
          </div>
        </div>
      </Group>

      <Group>
        <div
          className="grid"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          role="application"
          aria-label="Поле 2048"
        >
          {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => (
            <div key={`bg-${i}`} className="cell" />
          ))}

          {tiles.map(({ key, r, c, value }) => {
            const emoji = emojiMap[value] || '🌌';
            return (
              <div
                key={key}
                className={`tile tile-${value <= 2048 ? value : 'super'}`}
                style={{ gridRowStart: r + 1, gridColumnStart: c + 1 }}
              >
                {showEmoji && (
                  <span className="emoji" aria-hidden="true">
                    {emoji}
                  </span>
                )}
                <span className="num">{value}</span>
              </div>
            );
          })}

          {(over || won) && (
            <div className={`overlay ${won ? 'won' : 'over'}`}>
              <div className="overlay-card">
                <div className="title">{won ? 'Победа!' : 'Игра окончена'}</div>
                <div className="subtitle">
                  Счет: {score} · Рекорд: {best}
                </div>
                <div className="overlay-actions">
                  <Button appearance="accent" size="m" onClick={startNew}>
                    Сыграть еще
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <Spacing size={12} />

        {won && (
          <SimpleCell before={<Icon28StatisticsOutline />} multiline>
            Вы собрали 2048! Игра продолжается — попробуйте улучшить результат.
          </SimpleCell>
        )}
        {over && (
          <SimpleCell multiline>
            Ходов больше нет. Нажмите «Новая игра», чтобы начать заново.
          </SimpleCell>
        )}

        <Spacing size={12} />
        <div className="controls">
          <Button size="m" onClick={() => applyMove('up')}>
            Вверх
          </Button>
          <div className="h-controls">
            <Button size="m" onClick={() => applyMove('left')}>
              Влево
            </Button>
            <Button size="m" onClick={() => applyMove('right')}>
              Вправо
            </Button>
          </div>
          <Button size="m" onClick={() => applyMove('down')}>
            Вниз
          </Button>
        </div>

        <Spacing size={16} />
        <div className="tools">
          <Button size="s" mode="secondary" onClick={resetBest}>
            Сбросить рекорд
          </Button>
        </div>
      </Group>
    </Panel>
  );
}