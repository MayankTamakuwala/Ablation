import PropTypes from "prop-types";

export default PropTypes.shape({
  _id: PropTypes.string.isRequired,
  experimentLabel: PropTypes.string.isRequired,
  baseModel: PropTypes.string.isRequired,
  learningRate: PropTypes.number.isRequired,
  batchSize: PropTypes.number.isRequired,
  epochs: PropTypes.number.isRequired,
  seed: PropTypes.number.isRequired,
  accuracy: PropTypes.number.isRequired,
  loss: PropTypes.number.isRequired,
  durationMinutes: PropTypes.number.isRequired,
  reproduced: PropTypes.bool.isRequired,
  createdAt: PropTypes.string.isRequired,
});
