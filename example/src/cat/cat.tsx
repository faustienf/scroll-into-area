import { useRef, useEffect, Fragment, PointerEvent } from "react";
import { Position, scrollIntoArea } from "scroll-into-area";
import { easeOutCubic } from "../shared/utils";

import "./cat.css";

export const Cat = () => {
  const topRef = useRef<HTMLUListElement>(null);
  const earsRef = useRef<HTMLLIElement>(null);
  const headRef = useRef<HTMLUListElement>(null);
  const eyesRef = useRef<HTMLLIElement>(null);

  const handlePointerOver = (e: PointerEvent) => {
    if (
      !earsRef.current ||
      !eyesRef.current ||
      !topRef.current ||
      !headRef.current
    ) {
      return;
    }

    if (!(e.target instanceof HTMLButtonElement)) {
      return;
    }

    const [x, y] = e.target.dataset.position?.split("-") as [
      Position,
      Position,
    ];

    scrollIntoArea(earsRef.current, {
      container: topRef.current,
      x,
      y: "start",
      duration: 600, // ms
      easing: easeOutCubic,
    });

    scrollIntoArea(eyesRef.current, {
      container: headRef.current,
      x,
      y,
      duration: 400, // ms
      easing: easeOutCubic,
    });
  };

  useEffect(() => {
    if (
      !earsRef.current ||
      !eyesRef.current ||
      !topRef.current ||
      !headRef.current
    ) {
      return;
    }

    scrollIntoArea(earsRef.current, {
      container: topRef.current,
      x: "end",
      y: "start",
    });

    scrollIntoArea(eyesRef.current, {
      container: headRef.current,
      x: "end",
      y: "start",
    });
  }, []);

  return (
    <div className="cat-area" onPointerOver={handlePointerOver}>
      <button className="position" data-position="start-start" />
      <button className="position" data-position="center-start" />
      <button className="position" data-position="end-start" />
      <button className="position" data-position="start-center" />

      <div className="cat">
        <ul className="cat-ears" ref={topRef}>
          <li />
          <li ref={earsRef} />
          <li />
        </ul>
        <ul className="cat-head" ref={headRef}>
          {Array.from({ length: 5 }, (_item, index) => (
            <Fragment key={String(index)}>
              <li />
              <li />
              <li ref={index === 2 ? eyesRef : undefined} />
              <li />
              <li />
            </Fragment>
          ))}
        </ul>
        <span className="cat-tail" />
      </div>

      <button className="position" data-position="end-center" />
      <button className="position" data-position="start-end" />
      <button className="position" data-position="center-end" />
      <button className="position" data-position="end-end" />
    </div>
  );
};
