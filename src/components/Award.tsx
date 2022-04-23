import React from 'react'

type AwardItemProps = {
  year: string;
  title: string;
  text: string;
}

const AwardItem = ({
  year,
  title,
  text,
}: AwardItemProps): React.ReactElement => {
  return (
    <div className="award__card">
      <div className="award__year">
        {year}
      </div>
      <h6 className="award__title">{title} - {""}
        <span>
          {text}
        </span>
      </h6>
    </div>
    )
}

const Award = () => {
  return (
      <div className="award__container d-flex align-items-center flex-wrap justify-content-between">
        <div className="award__item">
          <AwardItem year="2020" title="Lorem ipsum" text="Lorem Ipsum dolor, amet sit consectetur adipicising elit. Prosenteum, molecias"/>
        </div>
        <div className="award__item">
          <AwardItem year="2020" title="Lorem ipsum" text="Lorem Ipsum dolor, amet sit consectetur adipicising elit. Prosenteum, molecias"/>
        </div>
        <div className="award__item">
          <AwardItem year="2020" title="Lorem ipsum" text="Lorem Ipsum dolor, amet sit consectetur adipicising elit. Prosenteum, molecias"/>
        </div>
      </div>
    )
}

export default Award