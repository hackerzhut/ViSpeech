/* eslint-disable no-underscore-dangle */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import OrderService from 'services/order.service'
import PayReviewModal from './components/PayReviewModal/PayReviewModal.component'

const stripePromise = loadStripe('pk_test_QvCrSmhHX1KYmSursjHff12u00sO1Zz8cq')

const CheckoutForm = ({ checkoutInfo, onOrderSuccess }) => {
  const stripe = useStripe()
  const elements = useElements()

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function createToken() {
      const cardElement = elements.getElement(CardElement)
      const { user, tokenType } = checkoutInfo
      const result = await OrderService.createPaymentIntent(tokenType.price * 100)
      const paymentMethodReq = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        },
      })
      if (paymentMethodReq.error) {
        setErrorMessage(paymentMethodReq.error.message)
        setIsLoading(false)
      } else {
        const confirmedCardPayment = await stripe.confirmCardPayment(result.clientSecret, {
          payment_method: paymentMethodReq.paymentMethod.id,
        })
        if (confirmedCardPayment.error) {
          setErrorMessage(confirmedCardPayment.error.message)
          setIsLoading(false)
        } else if (confirmedCardPayment.paymentIntent.status === 'succeeded') {
          // The payment has been processed!
          const result = await OrderService.createOrder({
            userId: user._id,
            tokenType,
          })
          setIsLoading(false)
          onOrderSuccess({
            minutes: tokenType.minutes,
            tokenId:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNlZTg2MzEwLTVmNzUtMTFlYS04N2Y2LTQ1ZThlYzg3YzY3ZCIsImlhdCI6MTU4MzQ3NzAyMX0.7ZHNhorBAE4GqXG2KLh2hDNCD1MzrxZgxQzGrUUxW9A',
          })
          window.$('#pay-online').modal('hide')
          window.$('#pay-review').modal('show')
        }
      }
    }

    if (isLoading) {
      try {
        createToken()
      } catch (error) {
        setErrorMessage(error.message)
        setIsLoading(false)
      }
    }
  }, [checkoutInfo, elements, isLoading, stripe, onOrderSuccess])

  const onSubmit = () => {
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make  sure to disable form submission until Stripe.js has loaded.
      return
    }
    setIsLoading(true)
  }

  const cardElementOptions = {
    iconStyle: 'solid',
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '18px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
    hidePostalCode: true,
  }

  return (
    <form onSubmit={onSubmit}>
      <CardElement options={cardElementOptions} />
      <div className="mgt-1-5x pdb-2-5x pdt-1-5x">
        <input
          type="checkbox"
          className="input-checkbox input-checkbox-md"
          id="agree-term-3"
          required
        />
        <label htmlFor="agree-term-3">
          Tôi đồng ý với
          <strong> điều khoản giao dịch mua bán key</strong> của Softia.
        </label>
      </div>
      <ul className="d-flex flex-wrap align-items-center guttar-30px">
        <li>
          {errorMessage !== '' && (
            <div
              className="alert alert-danger alert-dismissible fade show"
              id="alert-login"
              role="alert"
            >
              <button type="button" className="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
              {errorMessage}
            </div>
          )}
          <button type="submit" className={`btn btn-primary ${isLoading ? 'disabled' : ''}`}>
            Thanh toán <em className="ti ti-arrow-right mgl-2x" />
          </button>
          {/* <a
            style={{ display: 'none' }}
            href="#"
            data-dismiss="modal"
            data-toggle="modal"
            data-target="#pay-review"
            className="btn btn-primary"
          >
            Thanh toán
          </a> */}
        </li>
      </ul>
      <div className="gaps-2x" />
      <div className="gaps-1x d-none d-sm-block" />
      <div className="note note-plane note-light mgb-1x">
        <em className="fas fa-info-circle" />
        <p className="text-light">
          Sau khi giao dịch thành công, trang web sẽ hiển thị key cho bạn.
        </p>
      </div>
    </form>
  )
}

const PayOnlineModal = ({ payOnlineModal }) => {
  const [payReview, setPayReview] = useState({})

  const onOrderSuccess = orderData => {
    setPayReview({
      minutes: orderData.minutes,
      tokenId: orderData.tokenId,
    })
  }

  return (
    <>
      <div className="modal fade" id="pay-online" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-md modal-dialog-centered">
          <div className="modal-content pb-0">
            <div className="popup-body">
              <h4 className="popup-title">Thanh toán mua token</h4>
              <p className="lead" style={{ color: '#495463' }}>
                Mua token và sử dụng trong vòng{' '}
                {payOnlineModal.tokenType && (
                  <>
                    <strong>{payOnlineModal.tokenType.minutes} phút</strong> với số tiền{' '}
                    <strong>{payOnlineModal.tokenType.price} $</strong>.
                  </>
                )}
              </p>
              <h5 className="mgt-1-5x font-mid">Vui lòng nhập thông tin thẻ</h5>
              <div className="mgt-1-5x">
                <Elements stripe={stripePromise}>
                  <CheckoutForm checkoutInfo={payOnlineModal} onOrderSuccess={onOrderSuccess} />
                </Elements>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PayReviewModal payReviewModal={payReview} />
    </>
  )
}

export default PayOnlineModal
